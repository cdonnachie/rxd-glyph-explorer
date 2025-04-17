import dotenv from "dotenv"
import path from "path"

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

export function loadEnv() {
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
