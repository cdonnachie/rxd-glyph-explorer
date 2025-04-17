import { Stats, type StatsDocument } from "../models/stats.model"
import { connectToDatabase } from "../connect"

export class StatsRepository {
  constructor() {
    // Ensure database connection
    connectToDatabase()
  }

  async getStats(): Promise<StatsDocument | null> {
    // Always get the most recent stats document
    return Stats.findOne().sort({ lastUpdated: -1 })
  }

  async updateStats(statsData: Partial<StatsDocument>): Promise<StatsDocument> {
    // Find the current stats document or create a new one
    const currentStats = await this.getStats()

    if (currentStats) {
      // Update existing stats
      Object.assign(currentStats, statsData, { lastUpdated: new Date() })
      return currentStats.save()
    } else {
      // Create new stats document
      const stats = new Stats({
        ...statsData,
        lastUpdated: new Date(),
      })
      return stats.save()
    }
  }

  async calculateAndUpdateStats(): Promise<StatsDocument> {
    // This method will calculate fresh stats from the database
    // and update the stats document
    const { BlockHeaderRepository } = require("./block-header.repository")
    const { GlyphRepository } = require("./glyph.repository")
    const { TxORepository } = require("./txo.repository")
    const { GlyphType } = require("../models/enums")

    const blockRepo = new BlockHeaderRepository()
    const glyphRepo = new GlyphRepository()
    const txoRepo = new TxORepository()

    // Get block stats
    const blockCount = await blockRepo.getBlockCount()
    const latestBlock = await blockRepo.getLatestBlock()

    // Get glyph stats
    const nftCount = await glyphRepo.countByTokenType(GlyphType.NFT)
    const ftCount = await glyphRepo.countByTokenType(GlyphType.FT)
    const datCount = await glyphRepo.countByTokenType(GlyphType.DAT)
    const userCount = await glyphRepo.countByTokenType(GlyphType.USER)
    const containerCount = await glyphRepo.countDocuments({
      $or: [{ isContainer: true }, { tokenType: GlyphType.CONTAINER }],
    })
    const containedItemsCount = await glyphRepo.countDocuments({
      container: { $ne: "Unknown" },
      $or: [{ isContainer: { $exists: false } }, { isContainer: false }],
    })

    // Get TXO stats
    const rxdCount = await txoRepo.countByContractType("RXD")
    const nftTxoCount = await txoRepo.countByContractType("NFT")
    const ftTxoCount = await txoRepo.countByContractType("FT")

    // Prepare stats data
    const statsData = {
      glyphs: {
        total: nftCount + ftCount + datCount + containerCount + userCount,
        nft: nftCount,
        ft: ftCount,
        dat: datCount,
        containers: containerCount,
        containedItems: containedItemsCount,
        users: userCount,
      },
      txos: {
        total: rxdCount + nftTxoCount + ftTxoCount,
        rxd: rxdCount,
        nft: nftTxoCount,
        ft: ftTxoCount,
      },
      blocks: {
        count: blockCount,
        latest: latestBlock
          ? {
              hash: latestBlock.hash,
              height: latestBlock.height,
              timestamp: latestBlock.timestamp,
            }
          : null,
      },
      lastUpdated: new Date(),
    }

    // Update stats in database
    return this.updateStats(statsData)
  }
}
