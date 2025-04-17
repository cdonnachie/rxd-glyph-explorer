import { ImportLog, type ImportLogDocument, type LogLevel } from "../models/import-log.model"
import { connectToDatabase } from "../connect"

export class ImportLogRepository {
  constructor() {
    // Ensure database connection
    connectToDatabase()
  }

  async findById(id: string): Promise<ImportLogDocument | null> {
    return ImportLog.findById(id)
  }

  async findAll(
    limit = 100,
    skip = 0,
    level?: LogLevel,
    startDate?: Date,
    endDate?: Date,
    blockHeight?: number,
  ): Promise<ImportLogDocument[]> {
    const query: any = {}

    if (level) {
      query.level = level
    }

    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) {
        query.timestamp.$gte = startDate
      }
      if (endDate) {
        query.timestamp.$lte = endDate
      }
    }

    if (blockHeight !== undefined) {
      query.blockHeight = blockHeight
    }

    return ImportLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit)
  }

  async create(logData: Partial<ImportLogDocument>): Promise<ImportLogDocument> {
    const log = new ImportLog(logData)
    return log.save()
  }

  async countLogs(level?: LogLevel, startDate?: Date, endDate?: Date, blockHeight?: number): Promise<number> {
    const query: any = {}

    if (level) {
      query.level = level
    }

    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) {
        query.timestamp.$gte = startDate
      }
      if (endDate) {
        query.timestamp.$lte = endDate
      }
    }

    if (blockHeight !== undefined) {
      query.blockHeight = blockHeight
    }

    return ImportLog.countDocuments(query)
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await ImportLog.deleteMany({ timestamp: { $lt: date } })
    return result.deletedCount || 0
  }
}
