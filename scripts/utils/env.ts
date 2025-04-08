import dotenv from "dotenv"
import path from "path"

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

// Export a function to ensure environment variables are loaded
export function loadEnv() {
  // This function is just to ensure the dotenv.config() above is executed
  return true
}

// Helper function to get required environment variables
export function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`)
  }
  return value
}
