import { type NextRequest, NextResponse } from "next/server"
import { GlyphRepository } from "@/lib/db/repositories/glyph.repository"
import type { GlyphType } from "@/lib/db/models/enums"
import connectToDatabase from "@/lib/db/connect"

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const glyphRepo = new GlyphRepository()

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")
    const tokenType = searchParams.get("tokenType") as GlyphType | null
    const author = searchParams.get("author")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const skip = Number.parseInt(searchParams.get("skip") || "0")

    let glyphs

    if (query) {
      glyphs = await glyphRepo.search(query, limit, skip)
    } else if (tokenType) {
      glyphs = await glyphRepo.findByTokenType(tokenType, limit, skip)
    } else if (author) {
      glyphs = await glyphRepo.findByAuthor(author, limit, skip)
    } else {
      glyphs = await glyphRepo.findAll(limit, skip)
    }

    return NextResponse.json({ glyphs })
  } catch (error) {
    console.error("Error fetching glyphs:", error)
    return NextResponse.json({ error: "Failed to fetch glyphs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const glyphRepo = new GlyphRepository()

    const body = await request.json()

    // Convert ArrayBuffer to Buffer for MongoDB storage
    if (body.embed?.b) {
      body.embed.b = Buffer.from(body.embed.b)
    }
    if (body.remote?.h) {
      body.remote.h = Buffer.from(body.remote.h)
    }
    if (body.remote?.hs) {
      body.remote.hs = Buffer.from(body.remote.hs)
    }

    const glyph = await glyphRepo.create(body)

    return NextResponse.json({ glyph }, { status: 201 })
  } catch (error) {
    console.error("Error creating glyph:", error)
    return NextResponse.json({ error: "Failed to create glyph" }, { status: 500 })
  }
}

