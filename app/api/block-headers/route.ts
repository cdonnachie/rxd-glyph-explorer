import { type NextRequest, NextResponse } from "next/server"
import { BlockHeaderRepository } from "@/lib/db/repositories/block-header.repository"
import { connectToDatabase } from "@/lib/db/connect"

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const blockRepo = new BlockHeaderRepository()

    const searchParams = request.nextUrl.searchParams
    const height = searchParams.get("height")
    const hash = searchParams.get("hash")
    const latest = searchParams.get("latest") === "true"
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const skip = Number.parseInt(searchParams.get("skip") || "0")

    let blockHeaders

    if (latest) {
      blockHeaders = await blockRepo.getLatestBlock()
    } else if (height) {
      blockHeaders = await blockRepo.findByHeight(Number.parseInt(height))
    } else if (hash) {
      blockHeaders = await blockRepo.findByHash(hash)
    } else {
      blockHeaders = await blockRepo.findAll(limit, skip)
    }

    return NextResponse.json({ blockHeaders })
  } catch (error) {
    console.error("Error fetching block headers:", error)
    return NextResponse.json({ error: "Failed to fetch block headers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const blockRepo = new BlockHeaderRepository()

    const body = await request.json()

    // Convert ArrayBuffer to Buffer for MongoDB storage
    if (body.buffer) {
      body.buffer = Buffer.from(body.buffer)
    }

    const blockHeader = await blockRepo.create(body)

    return NextResponse.json({ blockHeader }, { status: 201 })
  } catch (error) {
    console.error("Error creating block header:", error)
    return NextResponse.json({ error: "Failed to create block header" }, { status: 500 })
  }
}

