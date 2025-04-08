import fs from "fs"
import path from "path"
import { config } from "../config"

// Ensure log directory exists
const logDir = path.dirname(config.logging.filePath)
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
}

class Logger {
  private level: number

  constructor() {
    this.level = LOG_LEVELS[config.logging.level as keyof typeof LOG_LEVELS] || LOG_LEVELS.info
  }

  private log(level: keyof typeof LOG_LEVELS, message: string, data?: any) {
    if (LOG_LEVELS[level] <= this.level) {
      const timestamp = new Date().toISOString()
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`

      // Log to console
      console.log(logMessage)
      if (data) {
        console.log(data)
      }

      // Log to file
      const logEntry = `${logMessage}${data ? " " + JSON.stringify(data, null, 2) : ""}\n`
      try {
        fs.appendFileSync(path.normalize(config.logging.filePath), logEntry)
      } catch (error) {
        console.error(`Failed to write to log file: ${error}`)
      }
    }
  }

  error(message: string, data?: any) {
    this.log("error", message, data)
  }

  warn(message: string, data?: any) {
    this.log("warn", message, data)
  }

  info(message: string, data?: any) {
    this.log("info", message, data)
  }

  verbose(message: string, data?: any) {
    this.log("verbose", message, data)
  }

  debug(message: string, data?: any) {
    this.log("debug", message, data)
  }
}

export const logger = new Logger()

