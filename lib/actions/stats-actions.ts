"use server"
import { StatsRepository } from "@/lib/db/repositories/stats.repository"
import { connectToDatabase } from "@/lib/db/connect"

// Define the stats interface
export interface StatsData {
  glyphs: {
    total: number
    nft: number
    ft: number
    dat: number
    containers: number
    containedItems: number
    users: number
  }
  txos: {
    total: number
    rxd: number
    nft: number
    ft: number
  }
  blocks: {
    count: number
    latest: {
      hash: string
      height: number
      timestamp: string
    } | null
  }
}

let statsCache: { data: StatsData; timestamp: number } | null = null
const CACHE_TTL = 60000 // 1 minute cache

export async function getStats(): Promise<StatsData> {
  // Check if we have a valid cache
  if (statsCache && Date.now() - statsCache.timestamp < CACHE_TTL) {
    return statsCache.data
  }

  await connectToDatabase()
  const statsRepo = new StatsRepository()

  // Get stats from the database
  const stats = await statsRepo.getStats()

  if (!stats) {
    // If no stats exist yet, calculate them
    const freshStats = await statsRepo.calculateAndUpdateStats()
    return mapStatsToResponse(freshStats)
  }

  // Map the database stats to the response format
  const result = mapStatsToResponse(stats)

  // Update the cache
  statsCache = {
    data: result,
    timestamp: Date.now(),
  }

  return result
}

// Helper function to map database stats to response format
function mapStatsToResponse(stats: any): StatsData {
  return {
    glyphs: {
      total: stats.glyphs.total,
      nft: stats.glyphs.nft,
      ft: stats.glyphs.ft,
      dat: stats.glyphs.dat,
      containers: stats.glyphs.containers,
      containedItems: stats.glyphs.containedItems,
      users: stats.glyphs.users,
    },
    txos: {
      total: stats.txos.total,
      rxd: stats.txos.rxd,
      nft: stats.txos.nft,
      ft: stats.txos.ft,
    },
    blocks: {
      count: stats.blocks.count,
      latest: stats.blocks.latest
        ? {
            hash: stats.blocks.latest.hash,
            height: stats.blocks.latest.height,
            timestamp: stats.blocks.latest.timestamp.toISOString(),
          }
        : null,
    },
  }
}

// Update refreshStats to recalculate stats
export async function refreshStats(): Promise<StatsData> {
  // Clear the cache
  statsCache = null

  await connectToDatabase()
  const statsRepo = new StatsRepository()

  // Force recalculation of stats
  const freshStats = await statsRepo.calculateAndUpdateStats()
  return mapStatsToResponse(freshStats)
}
