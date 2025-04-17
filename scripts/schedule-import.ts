import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import { loadEnv } from "./utils/env"
import { logger } from "./utils/logger"
import { RadiantCli } from "./utils/radiant-cli"
import { ImportStateRepository } from "../lib/db/repositories/import-state.repository"
import { connectToDatabase } from "../lib/db/connect"

// Ensure environment variables are loaded
loadEnv()

const execAsync = promisify(exec)

// Path to the import script
const importScriptPath = path.join(__dirname, "import-blockchain.ts")

// Time constants
const FIVE_MINUTES = 5 * 60 * 1000
const QUICK_RETRY_INTERVAL = 5 * 1000 // 5 seconds

// Flag to track if we're in initial sync mode
let initialSyncMode = true

// Run the import script
async function runImport(): Promise<boolean> {
  try {
    logger.info(`Running blockchain import script: ${importScriptPath}`)

    // Execute the import script
    const { stdout, stderr } = await execAsync(`npx tsx ${importScriptPath}`)
    if (stdout) {
      logger.info(`Import stdout: ${stdout}`)
    }

    if (stderr) {
      logger.warn(`Import stderr: ${stderr}`)
    }

    logger.info("Import completed")
    return true
  } catch (error) {
    logger.error("Import failed", error)
    return false
  }
}

// Check if blockchain is fully synced
async function isFullySynced(): Promise<boolean> {
  try {
    await connectToDatabase()
    const importStateRepo = new ImportStateRepository()
    const radiantCli = new RadiantCli()

    const importState = await importStateRepo.getState()
    const currentBlockchainHeight = await radiantCli.getBlockCount()

    logger.info(
      `Current blockchain height: ${currentBlockchainHeight}, Last imported height: ${importState.lastBlockHeight}`,
    )

    // Consider synced if we're within 1 block of the current blockchain height
    return importState.lastBlockHeight >= currentBlockchainHeight - 1
  } catch (error) {
    logger.error("Error checking sync status", error)
    return false
  }
}

// Schedule the next run based on sync status
async function scheduleNextRun() {
  try {
    // Check if we're fully synced
    const synced = await isFullySynced()

    if (initialSyncMode && synced) {
      // If we were in initial sync mode and now we're synced, switch to regular mode
      initialSyncMode = false
      logger.info("Initial blockchain sync completed. Switching to regular 5-minute interval.")
      setTimeout(runAndSchedule, FIVE_MINUTES)
    } else if (initialSyncMode) {
      // If we're still in initial sync mode, run again quickly
      logger.info("Still in initial sync mode. Running again soon...")
      setTimeout(runAndSchedule, QUICK_RETRY_INTERVAL)
    } else {
      // Regular mode - run every 5 minutes
      logger.info("Scheduling next import in 5 minutes")
      setTimeout(runAndSchedule, FIVE_MINUTES)
    }
  } catch (error) {
    logger.error("Error in scheduleNextRun", error)
    // If there's an error, retry in 1 minute
    setTimeout(runAndSchedule, 60 * 1000)
  }
}

// Run the import and schedule the next run
async function runAndSchedule() {
  await runImport()

  try {
    const { StatsRepository } = require("../lib/db/repositories/stats.repository")
    const statsRepo = new StatsRepository()
    await statsRepo.calculateAndUpdateStats()
    logger.info("Stats updated successfully")
  } catch (error) {
    logger.error("Error updating stats", error)
  }  
  await scheduleNextRun()
}

// Initial run
logger.info("Starting import scheduler")
logger.info("Initial sync mode: Running continuously until blockchain is fully synced")
runAndSchedule().catch((error) => {
  logger.error("Unhandled error in import scheduler", error)
})
