import { type NextRequest, NextResponse } from "next/server"
import { ImportLogRepository } from "@/lib/db/repositories/import-log.repository"
import type { LogLevel } from "@/lib/db/models/import-log.model"
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
    const logRepo = new ImportLogRepository()

    const searchParams = request.nextUrl.searchParams
    const level = searchParams.get("level") as LogLevel | null
    const startDateStr = searchParams.get("startDate")
    const endDateStr = searchParams.get("endDate")
    const blockHeight = searchParams.get("blockHeight")
      ? Number.parseInt(searchParams.get("blockHeight") as string, 10)
      : undefined
    const limit = Number.parseInt(searchParams.get("limit") || "100", 10)
    const skip = Number.parseInt(searchParams.get("skip") || "0", 10)

    // Parse dates if provided
    const startDate = startDateStr ? new Date(startDateStr) : undefined
    const endDate = endDateStr ? new Date(endDateStr) : undefined

    // Get logs
    const logs = await logRepo.findAll(limit, skip, level || undefined, startDate, endDate, blockHeight)

    // Get total count for pagination
    const total = await logRepo.countLogs(level || undefined, startDate, endDate, blockHeight)

    return NextResponse.json({
      logs,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + logs.length < total,
      },
    })
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}

// Endpoint to clear old logs
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    if (!authenticate(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const logRepo = new ImportLogRepository()

    const { olderThan } = await request.json()

    if (!olderThan) {
      return NextResponse.json({ error: "olderThan date is required" }, { status: 400 })
    }

    const date = new Date(olderThan)
    const deletedCount = await logRepo.deleteOlderThan(date)

    return NextResponse.json({
      message: `Successfully deleted ${deletedCount} logs older than ${date.toISOString()}`,
      deletedCount,
    })
  } catch (error) {
    console.error("Error deleting logs:", error)
    return NextResponse.json({ error: "Failed to delete logs" }, { status: 500 })
  }
}
