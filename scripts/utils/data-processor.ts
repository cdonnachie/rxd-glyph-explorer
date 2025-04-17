import { BlockHeaderRepository } from "../../lib/db/repositories/block-header.repository"
import { TxORepository } from "../../lib/db/repositories/txo.repository"
import { GlyphRepository } from "../../lib/db/repositories/glyph.repository"
import { ContractType } from "../../lib/db/models/enums"
import { RadiantCli } from "./radiant-cli"
import { logger } from "./logger"
import {
  delegateBurnScriptSize,
  delegateTokenScriptSize,
  ftScriptSize,
  mutableNftScriptSize,
  nftScriptSize,
} from "../../lib/script"
import { extractRevealPayload } from "../../lib/token"
import { Types } from 'mongoose'
import type { GlyphDocument } from "../../lib/db/models/glyph.model"
import { default as Outpoint } from "../../lib/Outpoint"
import { GLYPH_FT, GLYPH_NFT } from "../../lib/protocols"
import { GLYPH_DAT, GLYPH_MUT } from "../../lib/protocols"

import * as radiant from '@radiantblockchain/radiantjs'
const { Transaction } = radiant

export class DataProcessor {
  private blockHeaderRepo: BlockHeaderRepository
  private txoRepo: TxORepository
  private glyphRepo: GlyphRepository
  private radiantCli: RadiantCli

  constructor() {
    this.blockHeaderRepo = new BlockHeaderRepository()
    this.txoRepo = new TxORepository()
    this.glyphRepo = new GlyphRepository()
    this.radiantCli = new RadiantCli()
  }

  async processBlock(blockData: any): Promise<void> {
    try {
      logger.info(`Processing block ${blockData.height} (${blockData.hash})`, null, { blockHeight: blockData.height })

      // Store block header
      await this.storeBlockHeader(blockData)

      // Process transactions
      for (const tx of blockData.tx) {
        await this.processTransaction(tx, blockData.height, blockData.time)
      }

      // Update the stats
      const { StatsRepository } = require("../../lib/db/repositories/stats.repository")
      const statsRepo = new StatsRepository()
      await statsRepo.calculateAndUpdateStats()
      
      logger.info(`Completed processing block ${blockData.height}`, null, { blockHeight: blockData.height })
    } catch (error) {
      logger.error(`Error processing block ${blockData.height}`, error, { blockHeight: blockData.height })
      throw error
    }
  }

  private async storeBlockHeader(blockData: any): Promise<void> {
    try {
      // Check if block already exists
      const existingBlock = await this.blockHeaderRepo.findByHash(blockData.hash)

      if (existingBlock) {
        logger.debug(`Block ${blockData.height} already exists, skipping header`)
        return
      }

      // Get the raw block hex (verbosity level 0)
      const rawBlockHex = await this.radiantCli.executeCommand("getblock", [blockData.hash, 0])

      // Convert hex to buffer
      const buffer = Buffer.from(rawBlockHex, "hex")

      // Create new block header
      await this.blockHeaderRepo.create({
        hash: blockData.hash,
        height: blockData.height,
        timestamp: new Date(blockData.time * 1000),
        buffer,
        reorg: false,
      })

      logger.debug(`Stored block header for block ${blockData.height}`)
    } catch (error) {
      logger.error(`Error storing block header for block ${blockData.height}`, error)
      throw error
    }
  }

  private async processTransaction(tx: any, blockHeight: number, blockTime: number): Promise<void> {
    try {
      logger.debug(`Processing transaction ${tx.txid}`, null, { blockHeight, txid: tx.txid })

      // Process outputs
      for (let vout = 0; vout < tx.vout.length; vout++) {
        await this.processOutput(tx, vout, blockHeight, blockTime)
      }

      // Mark inputs as spent after processing all outputs
      await this.markInputsAsSpent(tx)

    } catch (error) {
      logger.error(`Error processing transaction ${tx.txid}`, error, { blockHeight, txid: tx.txid })
      throw error
    }
  }

  private async processOutput(tx: any, vout: number, blockHeight: number, blockTime: number): Promise<void> {
    try {
      const output = tx.vout[vout]

      // Check if output already exists
      const existingTxo = await this.txoRepo.findByTxidAndVout(tx.txid, vout)

      if (existingTxo) {
        logger.debug(`Output ${tx.txid}:${vout} already exists, skipping`)
        return
      }

      // Determine contract type
      const contractType = this.determineContractType(output.scriptPubKey.hex)

      if (contractType) {
        // Create TXO
        const txo = await this.txoRepo.create({
          txid: tx.txid,
          vout,
          script: output.scriptPubKey.hex,
          value: output.value,
          date: blockTime,
          height: blockHeight,
          spent: 0,
          contractType,
        })

        logger.debug(`Stored TXO ${tx.txid}:${vout}`)

        // If this is a glyph-related output, process it
        if (contractType === ContractType.NFT || contractType === ContractType.FT) {
          await this.processGlyph(tx, output, txo._id as string, blockHeight, blockTime, contractType)
        } else if (contractType === ContractType.DELEGATE_BURN || contractType === ContractType.DELEGATE_TOKEN) {
          logger.debug(`Processing delegate burn or token for ${tx.txid}:${vout}`)
          await this.processGlyph(tx, output, txo._id as string, blockHeight, blockTime, contractType)
        }
      }
    } catch (error) {
      logger.error(`Error processing output ${tx.txid}:${vout}`, error)
      throw error
    }
  }

  private determineContractType(script: string): ContractType | null {

    if (!script) {
      return null
    }

    // Check for Glyph script
    switch (script.length / 2) {
      case ftScriptSize:
        return ContractType.FT
      case nftScriptSize:
        return ContractType.NFT
      case mutableNftScriptSize:
        return ContractType.NFT
      case delegateBurnScriptSize:
        return ContractType.DELEGATE_BURN
      case delegateTokenScriptSize:
        return ContractType.DELEGATE_TOKEN
      default:
        break
    }

    return null
  }

  private async processGlyph(
    tx: any,
    output: any,
    txoId: string,
    blockHeight: number,
    blockTime: number,
    contractType: ContractType,
  ): Promise<void> {
    try {
      const reveal = new Transaction(tx.hex)

      const op = Outpoint.fromString(tx.vin[0].txid)
      const linkedRef = Outpoint.fromUTXO(op.getTxid(), output.n).toString()
      const { revealIndex, glyph } = extractRevealPayload(linkedRef, reveal.inputs)

      let location = undefined
      if (glyph?.payload.loc !== undefined && Number.isInteger(glyph.payload.loc)) {
        // Location is set to a ref vout. Get the payload and merge.
        const vout = glyph.payload.loc as number
        const op = Outpoint.fromString(tx.vin[output.n].txid)
        const linkedRef = Outpoint.fromUTXO(op.getTxid(), vout).toString()
        const linked = extractRevealPayload(linkedRef, reveal.inputs)
        if (linked.revealIndex >= 0 && linked.glyph?.payload) {
          glyph.payload = { ...glyph.payload, ...linked.glyph.payload }
          glyph.embeddedFiles = {
            ...glyph.embeddedFiles,
            ...linked.glyph.embeddedFiles,
          }
          glyph.remoteFiles = {
            ...glyph.remoteFiles,
            ...linked.glyph.remoteFiles,
          }
          location = linkedRef;
        }
      }

      if (!glyph) {
        return
      }

      const { payload, embeddedFiles, remoteFiles } = glyph || {
        payload: undefined,
        embeddedFiles: {},
        remoteFiles: {},
      }

      const embed = "main" in embeddedFiles ? (embeddedFiles.main ? embeddedFiles.main : undefined) : undefined
      const protocols = payload?.p

      let contract: string | undefined
      if (protocols?.includes(GLYPH_FT)) {
        contract = "ft"
      } else if (protocols?.includes(GLYPH_NFT)) {
        contract = "nft"
      } else if (protocols?.includes(GLYPH_DAT)) {
        contract = "dat"
      } else {
        contract = undefined
      }

      const isMutable = protocols?.includes(GLYPH_MUT)
      const glyphContract = protocols?.includes(GLYPH_FT) ? "ft" : protocols?.includes(GLYPH_NFT) ? "nft" : undefined

      if (!glyphContract) {
        logger.warn(`Could not determine contract type for ${tx.txid}:${output.n}`)
        return
      }

      let containers = undefined
      let author = undefined
      if (payload) {
        if (payload.in) {
          containers =
            payload.in && payload.in.length > 0
              ? Outpoint.fromString(Buffer.from(new Uint8Array(payload.in[0])).toString("hex"))
                .reverse()
                .getTxid()
              : undefined
        }
        if (payload.by) {
          author = Outpoint.fromString(Buffer.from(new Uint8Array(payload.by[0])).toString("hex"))
            .reverse()
            .getTxid()
        }
      }

      const ticker = typeof payload?.ticker === "string" ? payload.ticker.substring(0, 20) : undefined

      const type = (payload?.type as string) || "object"

      // Map token protocol to enum
      let tokenType = contractType as ContractType
      switch (type) {
        case "user":
          tokenType = ContractType.USER
          break
        case "container":
          tokenType = ContractType.CONTAINER
          break
        default:
          tokenType = contractType
          break
      }

      const glyphData = {
        p: glyph?.payload.p || "",
        tokenType,
        type,
        ref: tx.vin[0].txid,
        name: (payload?.name as string) || "Unnamed Glyph",
        description: payload?.desc || "Imported from blockchain",
        author: author || "Unknown",
        container: containers || "Unknown",
        location: location,
        ticker,
        attrs: payload?.attrs,
        revealOutpoint: `${tx.txid}:${output.n}`,
        embed: { ...embed, b: embed?.b ? Buffer.from(new Uint8Array(embed.b)) : undefined },
        remote: {
          ...remoteFiles.main,
          h: remoteFiles.main?.h ? Buffer.from(new Uint8Array(remoteFiles.main.h)) : undefined,
          hs: remoteFiles.main?.hs ? Buffer.from(new Uint8Array(remoteFiles.main.hs)) : undefined,
        },
        spent: 0,
        fresh: 1,
        immutable: !isMutable,
      } as unknown as GlyphDocument

      // If this is a delegate token or burn, handle the relationship
      if (contractType === ContractType.DELEGATE_TOKEN || contractType === ContractType.DELEGATE_BURN) {
        // TODO: Implement delegate relationship handling 
        // This could involve updating the delegate's information or creating a new delegate entry ???
        logger.info(`Processing delegate relationship for ${tx.txid}:${output.n}`)
      }

      if (!glyphData) {
        logger.warn(`Could not extract glyph data from ${tx.txid}:${output.n}`)
        return
      }

      // Check if glyph already exists
      const existingGlyph = await this.glyphRepo.findByRef(glyphData.ref)

      if (
        existingGlyph &&
        (contractType === ContractType.DELEGATE_BURN || contractType === ContractType.DELEGATE_TOKEN)
      ) {
        logger.debug(`Glyph ${glyphData.ref} already exists, skipping`)
      } else if (existingGlyph) {
        logger.debug(`Glyph ${glyphData.ref} already exists, updating`)
        await this.glyphRepo.update(existingGlyph._id as string, {
          ...glyphData,
          lastTxoId: new Types.ObjectId(txoId),
          height: blockHeight,
          timestamp: blockTime,
        })
      } else {
        logger.debug(`Creating new glyph ${glyphData.ref}`)
        const newGlyph = await this.glyphRepo.create({
          ...glyphData,
          lastTxoId: new Types.ObjectId(txoId),
          height: blockHeight,
          timestamp: blockTime,
          spent: 0,
          fresh: 1,
        })

        // If this is a container, mark it as such
        if (this.isContainer(glyphData)) {
          await this.glyphRepo.update(newGlyph._id as string, { isContainer: true })
        }

        // If this glyph belongs to a container, add it to the container
        if (glyphData.container && glyphData.container !== "Unknown" && glyphData.container !== glyphData.ref) {
          const container = await this.glyphRepo.findByRef(glyphData.container)
          if (container) {
            await this.glyphRepo.addToContainer(glyphData.container, glyphData.ref)
            logger.debug(`Added glyph ${glyphData.ref} to container ${glyphData.container}`)
          }
        }
      }
    } catch (error) {
      logger.error(`Error processing glyph in ${tx.txid}:${output.n}`, error)
      throw error
    }
  }

  private isContainer(glyphData: any): boolean {
    // Check if this glyph is a container
    return glyphData.type === "container" || glyphData.isContainer === true
  }

  async markInputsAsSpent(tx: any): Promise<void> {
    try {
      for (const input of tx.vin) {
        if (!input.txid || input.vout === undefined) continue;
        
        const txo = await this.txoRepo.findByTxidAndVout(input.txid, input.vout);
        if (!txo || txo.spent === 1) continue;
        
        // Always mark the TXO as spent
        await this.txoRepo.markAsSpent(txo._id as string);
        
        const revealOutpoint = `${input.txid}:${input.vout}`;
        const glyph = await this.glyphRepo.findByRevealOutpoint(revealOutpoint);
        
        if (!glyph || glyph.spent === 1) continue;
        
        // Check if any output contains OP_PUSHINPUTREFSINGLETON referencing this input
        // TODO: Check if the input is a reference to a singleton
        // Might need to implement the actual logic to check for OP_PUSHINPUTREFSINGLETON
        // in the output script of the transaction.
        // For now, will assume that the scriptPubKey is in the vout of the input
        // and check if it contains the OP_PUSHINPUTREFSINGLETON opcode.
        const hasReference: boolean = tx.vout[input.vout].scriptPubKey?.asm?.includes("OP_PUSHINPUTREFSINGLETON") || false;
        
        if (!hasReference) {
          // Token is being melted - mark as spent
          // TODO: Validate logic to handle melting
          await this.glyphRepo.markAsSpent(glyph._id as string);
          logger.debug(`Marked glyph ${glyph.ref} as spent (melted)`);
        } else {
          // Token is being transferred - don't mark as spent
          // A new glyph record will be created in processOutput
          // TODO: Validate logic
          logger.debug(`Glyph ${glyph.ref} is being transferred, not marking as spent`);
        }
      }
    } catch (error) {
      logger.error(`Error marking inputs as spent for tx ${tx.txid}`, error);
      throw error;
    }
  }
  
}