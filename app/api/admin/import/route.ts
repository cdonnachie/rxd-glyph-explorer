import { type NextRequest, NextResponse } from "next/server"
import { ImportStateRepository } from "@/lib/db/repositories/import-state.repository"
import { RadiantCli } from "@/scripts/utils/radiant-cli"
import { DataProcessor } from "@/scripts/utils/data-processor"
import { logger } from "@/scripts/utils/logger"
import { connectToDatabase } from "@/lib/db/connect"

// Simple authentication middleware
const authenticate = (request: NextRequest) => {
  const apiKey = request.headers.get("x-api-key")
  return apiKey === process.env.ADMIN_API_KEY
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    if (!authenticate(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const importStateRepo = new ImportStateRepository()
    const state = await importStateRepo.getState()

    return NextResponse.json({
      lastBlockHeight: state.lastBlockHeight,
      lastBlockHash: state.lastBlockHash || " ",
      lastUpdated: state.lastUpdated,
      isImporting: state.isImporting,
    })
  } catch (error) {
    console.error("Error getting import state:", error)
    return NextResponse.json({ error: "Failed to get import state" }, { status: 500 })
  }
}

// Function to import blockchain data
async function importBlockchain(resetToBlock?: number) {
  try {
    logger.info("Starting blockchain import")

    // Connect to database
    await connectToDatabase()

    // Initialize repositories and utilities
    const importStateRepo = new ImportStateRepository()
    const radiantCli = new RadiantCli()
    const dataProcessor = new DataProcessor()

    // Get current import state
    const importState = await importStateRepo.getState()

    // If resetToBlock is provided, update the import state
    if (resetToBlock !== undefined) {
      await importStateRepo.updateState({
        lastBlockHeight: resetToBlock,
        lastBlockHash: " ",
      })
    }

    // Set import flag
    await importStateRepo.setImporting(true)

    try {
      // Get current blockchain height
      const currentHeight = await radiantCli.getBlockCount()
      logger.info(`Current blockchain height: ${currentHeight}`)

      // Get last imported height (after potential reset)
      const state = await importStateRepo.getState()
      const lastHeight = state.lastBlockHeight
      logger.info(`Last imported height: ${lastHeight}`)

      // Check if we need to import
      if (lastHeight >= currentHeight) {
        logger.info("No new blocks to import")
        return
      }

      // Calculate batch size
      const startHeight = lastHeight + 1
      const endHeight = Math.min(startHeight + 10 - 1, currentHeight) // Process 10 blocks at a time

      logger.info(`Importing blocks from ${startHeight} to ${endHeight}`)

      // Process blocks
      for (let height = startHeight; height <= endHeight; height++) {
        // Get block data
        const blockData = await radiantCli.getBlock(height)

        // Process block
        await dataProcessor.processBlock(blockData)

        // Update import state
        await importStateRepo.updateLastBlock(height, blockData.hash)

        logger.info(`Imported block ${height}/${endHeight}`)
      }

      logger.info(`Import completed. Imported blocks ${startHeight} to ${endHeight}`)
    } finally {
      // Clear import flag
      await importStateRepo.setImporting(false)
    }
  } catch (error) {
    logger.error("Import failed", error)
    const importStateRepo = new ImportStateRepository()
    await importStateRepo.setImporting(false)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    if (!authenticate(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const importStateRepo = new ImportStateRepository()
    const state = await importStateRepo.getState()

    // Get request body
    const body = await request.json()
    const { resetToBlock, resetImportFlag } = body || {}

    // If resetImportFlag is true, just reset the isImporting flag and return
    if (resetImportFlag === true) {
      await importStateRepo.setImporting(false)
      logger.info("Import flag reset to false")
      return NextResponse.json({
        message: "Import flag reset to false",
        lastBlockHeight: state.lastBlockHeight,
      })
    }    

    // Check if import is already running
    if (state.isImporting && !resetImportFlag) {
      return NextResponse.json({ error: "Import is already running" }, { status: 409 })
    }

    // Start the import process in the background
    // We don't await this so the API can return immediately
    importBlockchain(resetToBlock).catch((error) => {
      console.error("Error executing import:", error)
    })

    return NextResponse.json({
      message: "Import started",
      lastBlockHeight: resetToBlock !== undefined ? resetToBlock : state.lastBlockHeight,
    })
  } catch (error) {
    console.error("Error starting import:", error)
    return NextResponse.json({ error: "Failed to start import" }, { status: 500 })
  }
}

