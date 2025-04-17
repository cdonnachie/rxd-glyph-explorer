import { type NextRequest, NextResponse } from "next/server"
import { GlyphRepository } from "@/lib/db/repositories/glyph.repository"
import { mapDbGlyphToUi } from "@/lib/services/glyph-service"
import { connectToDatabase } from "@/lib/db/connect"

// Simple authentication middleware
const authenticate = (request: NextRequest) => {
  const apiKey = request.headers.get("x-api-key")
  return apiKey === process.env.ADMIN_API_KEY
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectToDatabase()
    const glyphRepo = new GlyphRepository()

    const searchParams = request.nextUrl.searchParams
    const includeContainerItems = searchParams.get("includeContainerItems") === "true"

    const glyph = await glyphRepo.findById(id)

    if (!glyph) {
      return NextResponse.json({ error: "Glyph not found" }, { status: 404 })
    }

    let containerItems: any = []
    if (includeContainerItems && glyph.isContainer && glyph.containerItems?.length) {
      containerItems = await glyphRepo.findByContainer(glyph.ref)
    }

    const processedGlyphs = await mapDbGlyphToUi(glyph, containerItems)
    return NextResponse.json({ glyph: processedGlyphs })
  } catch (error) {
    console.error("Error fetching glyph:", error)
    return NextResponse.json({ error: "Failed to fetch glyph" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

    // Check if container relationship has changed
    const existingGlyph = await glyphRepo.findById(id)
    if (existingGlyph && body.container && body.container !== existingGlyph.container) {
      // Remove from old container if it exists
      if (existingGlyph.container && existingGlyph.container !== "Unknown") {
        await glyphRepo.removeFromContainer(existingGlyph.container, existingGlyph.ref)
      }

      // Add to new container if it exists
      if (body.container !== "Unknown") {
        const container = await glyphRepo.findByRef(body.container)
        if (container) {
          await glyphRepo.addToContainer(body.container, existingGlyph.ref)
        }
      }
    }

    const glyph = await glyphRepo.update(id, body)

    if (!glyph) {
      return NextResponse.json({ error: "Glyph not found" }, { status: 404 })
    }

    return NextResponse.json({ glyph: mapDbGlyphToUi(glyph) })
  } catch (error) {
    console.error("Error updating glyph:", error)
    return NextResponse.json({ error: "Failed to update glyph" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;  
  try {

    // Check authentication
    if (!authenticate(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const glyphRepo = new GlyphRepository()

    // Get the glyph before deleting to handle container relationships
    const glyph = await glyphRepo.findById(id)

    if (!glyph) {
      return NextResponse.json({ error: "Glyph not found" }, { status: 404 })
    }

    // If this glyph belongs to a container, remove it from the container
    if (glyph.container && glyph.container !== "Unknown") {
      await glyphRepo.removeFromContainer(glyph.container, glyph.ref)
    }

    // If this is a container, handle its items
    if (glyph.isContainer && glyph.containerItems?.length) {
      // Update all items to remove container reference
      for (const itemRef of glyph.containerItems) {
        const item = await glyphRepo.findByRef(itemRef)
        if (item) {
          await glyphRepo.update(item._id as string, { container: "Unknown" })
        }
      }
    }

    const success = await glyphRepo.delete(id)

    if (!success) {
      return NextResponse.json({ error: "Glyph not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting glyph:", error)
    return NextResponse.json({ error: "Failed to delete glyph" }, { status: 500 })
  }
}

