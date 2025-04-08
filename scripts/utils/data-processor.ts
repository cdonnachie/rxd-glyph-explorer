import { BlockHeaderRepository } from "@/lib/db/repositories/block-header.repository"
import { TxORepository } from "@/lib/db/repositories/txo.repository"
import { GlyphRepository } from "@/lib/db/repositories/glyph.repository"
import { ContractType, GlyphType } from "@/lib/db/models/enums"
import { RadiantCli } from "./radiant-cli"
import { logger } from "./logger"

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
      logger.info(`Processing block ${blockData.height} (${blockData.hash})`)

      // Store block header
      await this.storeBlockHeader(blockData)

      // Process transactions
      for (const tx of blockData.tx) {
        await this.processTransaction(tx, blockData.height, blockData.time)
      }

      logger.info(`Completed processing block ${blockData.height}`)
    } catch (error) {
      logger.error(`Error processing block ${blockData.height}`, error)
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
      logger.debug(`Processing transaction ${tx.txid}`)

      // Process outputs
      for (let vout = 0; vout < tx.vout.length; vout++) {
        await this.processOutput(tx, vout, blockHeight, blockTime)
      }
    } catch (error) {
      logger.error(`Error processing transaction ${tx.txid}`, error)
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
      const contractType = this.determineContractType(output)

      if (contractType) {
        // Create TXO
        const txo = await this.txoRepo.create({
          txid: tx.txid,
          vout,
          script: output.scriptPubKey.hex,
          value: output.value,
          date: blockTime,
          height: blockHeight,
          spent: 0, // Assume unspent initially
          contractType,
        })

        logger.debug(`Stored TXO ${tx.txid}:${vout}`)

        // If this is a glyph-related output, process it
        if (contractType === ContractType.NFT || contractType === ContractType.FT) {
          await this.processGlyph(tx, output, txo._id as string, blockHeight)
        }
      }
    } catch (error) {
      logger.error(`Error processing output ${tx.txid}:${vout}`, error)
      throw error
    }
  }

  private determineContractType(output: any): ContractType | null {
    // This is a simplified implementation
    // In a real application, you would need to analyze the script to determine the contract type

    if (!output.scriptPubKey || !output.scriptPubKey.hex) {
      return null
    }

    const script = output.scriptPubKey.hex

    // Check for RXD script
    if (script.includes("52584420")) {
      // "RXD " in hex
      return ContractType.RXD
    }

    // Check for NFT script
    if (script.includes("4e465420")) {
      // "NFT " in hex
      return ContractType.NFT
    }

    // Check for FT script
    if (script.includes("465420")) {
      // "FT " in hex
      return ContractType.FT
    }

    return null
  }

  private async processGlyph(tx: any, output: any, txoId: string, blockHeight: number): Promise<void> {
    try {
      // Extract glyph data from the script
      // This is a simplified implementation
      // In a real application, you would need to parse the script to extract the glyph data

      const script = output.scriptPubKey.hex
      const asm = output.scriptPubKey.asm

      // Check if this is a glyph
      if (!this.isGlyphScript(script)) {
        return
      }

      // Extract glyph data
      const glyphData = this.extractGlyphData(script, asm)

      if (!glyphData) {
        logger.warn(`Could not extract glyph data from ${tx.txid}:${output.n}`)
        return
      }

      // Check if glyph already exists
      const existingGlyph = await this.glyphRepo.findByRef(glyphData.ref)

      if (existingGlyph) {
        logger.debug(`Glyph ${glyphData.ref} already exists, updating`)
        await this.glyphRepo.update(existingGlyph._id as string, {
          ...glyphData,
          lastTxoId: txoId,
          height: blockHeight,
        })
      } else {
        logger.debug(`Creating new glyph ${glyphData.ref}`)
        await this.glyphRepo.create({
          ...glyphData,
          lastTxoId: txoId,
          height: blockHeight,
          spent: 0,
          fresh: 1,
        })
      }
    } catch (error) {
      logger.error(`Error processing glyph in ${tx.txid}:${output.n}`, error)
      throw error
    }
  }

  private isGlyphScript(script: string): boolean {
    // Check if the script contains glyph-related opcodes
    // This is a simplified check
    return (
      script.includes("52584420") || // "RXD "
      script.includes("4e465420") || // "NFT "
      script.includes("465420")
    ) // "FT "
  }

  private extractGlyphData(script: string, asm: string): any {
    // This is a placeholder implementation
    // In a real application, you would need to parse the script to extract the glyph data

    // For demonstration purposes, we'll create some mock data
    const tokenType = script.includes("4e465420")
      ? GlyphType.NFT
      : script.includes("465420")
        ? GlyphType.FT
        : GlyphType.DAT

    const ref = `glyph-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    return {
      tokenType,
      ref,
      name: `Glyph ${ref}`,
      type: "unknown",
      description: "Imported from blockchain",
      author: "Unknown",
      container: "Unknown",
      attrs: {},
      revealOutpoint: `${script.substring(0, 10)}:0`,
    }
  }

  async markInputsAsSpent(tx: any): Promise<void> {
    try {
      // Process inputs to mark spent outputs
      for (const input of tx.vin) {
        if (input.txid && input.vout !== undefined) {
          const txo = await this.txoRepo.findByTxidAndVout(input.txid, input.vout)

          if (txo) {
            await this.txoRepo.markAsSpent(txo._id as string)
            logger.debug(`Marked TXO ${input.txid}:${input.vout} as spent`)

            // If this TXO is associated with a glyph, mark the glyph as spent
            const glyph = await this.glyphRepo.findOne({ lastTxoId: txo._id as string })

            if (glyph) {
              await this.glyphRepo.markAsSpent(glyph._id as string)
              logger.debug(`Marked glyph ${glyph.ref} as spent`)
            }
          }
        }
      }
    } catch (error) {
      logger.error(`Error marking inputs as spent for tx ${tx.txid}`, error)
      throw error
    }
  }
}

