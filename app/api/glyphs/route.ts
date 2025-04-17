import { type NextRequest, NextResponse } from "next/server"
import { GlyphRepository } from "@/lib/db/repositories/glyph.repository"
import type { GlyphType } from "@/lib/db/models/enums"
import { mapDbGlyphToUi } from "@/lib/services/glyph-service"
import { connectToDatabase } from "@/lib/db/connect"

// Simple authentication middleware
const authenticate = (request: NextRequest) => {
  const apiKey = request.headers.get("x-api-key")
  return apiKey === process.env.ADMIN_API_KEY
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const glyphRepo = new GlyphRepository()

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")
    const tokenType = searchParams.get("tokenType") as GlyphType | null
    const author = searchParams.get("author")
    const ref = searchParams.get("ref")
    const container = searchParams.get("container")
    const isContainer = searchParams.get("isContainer") === "true"
    const includeContainerItems = searchParams.get("includeContainerItems") === "true"
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const skip = Number.parseInt(searchParams.get("skip") || "0")

    let glyphs

    if (query) {
      glyphs = await glyphRepo.search(query, limit, skip)
    } else if (tokenType) {
      glyphs = await glyphRepo.findByTokenType(tokenType, limit, skip)
    } else if (author) {
      glyphs = await glyphRepo.findByAuthor(author, limit, skip)
    } else if (container) {
      glyphs = await glyphRepo.findByContainer(container, limit, skip)
    } else if (isContainer) {
      glyphs = await glyphRepo.findContainers(limit, skip)
    } else if (ref) {
      const exactMatch = await glyphRepo.findByRef(ref)
      if (exactMatch) {
        glyphs = [exactMatch]
      }else {
        glyphs = await glyphRepo.findByAuthor(ref, limit, skip)
      }
    } else if (searchParams.get("users") === "true") {
      glyphs = await glyphRepo.findUsers(limit, skip)
    } else {
      glyphs = await glyphRepo.findAll(limit, skip)
    }

    // Process glyphs to include container items if requested
    const processedGlyphs = await Promise.all(
      glyphs.map(async (glyph) => {
        if (includeContainerItems && glyph.isContainer && glyph.containerItems?.length) {
          const containerItems = await glyphRepo.findByContainer(glyph.ref)
          return await mapDbGlyphToUi(glyph, containerItems)
        }
        return await mapDbGlyphToUi(glyph)
      }),
    )

    return NextResponse.json({ glyphs: processedGlyphs })
  } catch (error) {
    console.error("Error fetching glyphs:", error)
    return NextResponse.json({ error: "Failed to fetch glyphs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {

    // Check authentication
    if (!authenticate(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // If this is a container, mark it as such
    if (body.isContainer) {
      await glyphRepo.update(glyph._id as string, { isContainer: true })
    }

    // If this glyph belongs to a container, add it to the container
    if (body.container && body.container !== "Unknown" && body.container !== body.ref) {
      const container = await glyphRepo.findByRef(body.container)
      if (container) {
        await glyphRepo.addToContainer(body.container, body.ref)
      }
    }

    return NextResponse.json({ glyph: mapDbGlyphToUi(glyph) }, { status: 201 })
  } catch (error) {
    console.error("Error creating glyph:", error)
    return NextResponse.json({ error: "Failed to create glyph" }, { status: 500 })
  }
}

