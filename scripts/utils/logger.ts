import { config } from "../config"
import { ImportLogRepository } from "../../lib/db/repositories/import-log.repository"
import { LogLevel } from "../../lib/db/models/import-log.model"

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
  private logRepo: ImportLogRepository | null = null

  constructor() {
    this.level = LOG_LEVELS[config.logging.level as keyof typeof LOG_LEVELS] || LOG_LEVELS.info

    // Initialize repository lazily to avoid connection issues during startup
    this.initRepository()
  }

  private async initRepository() {
    try {
      this.logRepo = new ImportLogRepository()
    } catch (error) {
      console.error("Failed to initialize log repository:", error)
    }
  }

  private async log(
    level: keyof typeof LOG_LEVELS,
    message: string,
    data?: any,
    metadata?: { blockHeight?: number; txid?: string },
  ) {
    if (LOG_LEVELS[level] <= this.level) {
      const timestamp = new Date()
      const logMessage = `[${timestamp.toISOString()}] [${level.toUpperCase()}] ${message}`

      // Log to console
      console.log(logMessage)
      if (data) {
        console.log(data)
      }

      // Log to database
      try {
        if (!this.logRepo) {
          await this.initRepository()
        }

        if (this.logRepo) {
          const dbLogLevel =
            level === "error"
              ? LogLevel.ERROR
              : level === "warn"
                ? LogLevel.WARN
                : level === "debug"
                  ? LogLevel.DEBUG
                  : LogLevel.INFO

          await this.logRepo.create({
            timestamp,
            level: dbLogLevel,
            message,
            details: data,
            blockHeight: metadata?.blockHeight,
            txid: metadata?.txid,
          })
        }
      } catch (dbError) {
        console.error(`Failed to write log to database: ${dbError}`)
      }
    }
  }

  error(message: string, data?: any, metadata?: { blockHeight?: number; txid?: string }) {
      this.log("error", message, data, metadata)
  }

  warn(message: string, data?: any, metadata?: { blockHeight?: number; txid?: string }) {
      this.log("warn", message, data, metadata)
  }

  info(message: string, data?: any, metadata?: { blockHeight?: number; txid?: string }) {
    this.log("info", message, data, metadata)
  }

  verbose(message: string, data?: any, metadata?: { blockHeight?: number; txid?: string }) {
      this.log("verbose", message, data, metadata)
  }

  debug(message: string, data?: any, metadata?: { blockHeight?: number; txid?: string }) {
      this.log("debug", message, data, metadata)
  }
}

export const logger = new Logger()
