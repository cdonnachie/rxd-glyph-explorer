import { loadEnv, getRequiredEnv } from "./utils/env"

// Ensure environment variables are loaded
loadEnv()

export const config = {
  // Radiant RPC configuration
  radiantCli: {
    // RPC connection details
    rpcHost: process.env.RADIANT_RPC_HOST || "127.0.0.1",
    rpcPort: process.env.RADIANT_RPC_PORT || "8332",
    rpcUser: process.env.RADIANT_RPC_USER || "user",
    rpcPassword: process.env.RADIANT_RPC_PASSWORD || "password",
    // Network (mainnet, testnet, regtest)
    network: process.env.RADIANT_NETWORK || "mainnet",
  },

  // MongoDB configuration
  mongodb: {
    uri: getRequiredEnv("MONGODB_URI"),
  },

  // Import configuration
  import: {
    // Number of blocks to process in a single batch
    batchSize: 50,
    // Maximum number of concurrent operations
    concurrency: 5,
    // Timeout for RPC commands in milliseconds
    commandTimeout: 30000,
  },

  // Logging configuration
  logging: {
    // Log level (error, warn, info, verbose, debug)
    level: process.env.LOG_LEVEL || "info",
  },
}
