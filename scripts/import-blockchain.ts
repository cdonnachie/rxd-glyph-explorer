import { loadEnv } from "./utils/env"
import { config } from "./config"
import { RadiantCli } from "./utils/radiant-cli"
import { DataProcessor } from "./utils/data-processor"
import { ImportStateRepository } from "../lib/db/repositories/import-state.repository"
import { logger } from "./utils/logger"
import { connectToDatabase } from "../lib/db/connect"

// Ensure environment variables are loaded
loadEnv()

export async function importBlockchain() {
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

    // Check if import is already running
    if (importState.isImporting) {
      logger.warn("Import is already running, exiting")
      return
    }

    // Set import flag
    await importStateRepo.setImporting(true)

    try {
      // Get current blockchain height
      const currentHeight = await radiantCli.getBlockCount()
      logger.info(`Current blockchain height: ${currentHeight}`)

      // Get last imported height
      const lastHeight = importState.lastBlockHeight
      logger.info(`Last imported height: ${lastHeight}`)

      // Check if we need to import
      if (lastHeight >= currentHeight) {
        logger.info("No new blocks to import")
        return
      }

      // Calculate batch size
      const startHeight = lastHeight + 1
      const endHeight = Math.min(startHeight + config.import.batchSize - 1, currentHeight)

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
    throw error
  }
}

// Run the import if this script is executed directly
  importBlockchain().catch((error) => {
    logger.error("Unhandled error in import", error)
    process.exit(1)
  }).finally(() => { 
    logger.info("Import script finished")
    process.exit(0)
  })

