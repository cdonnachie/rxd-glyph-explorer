import { type NextRequest, NextResponse } from "next/server"
import { GlyphRepository } from "@/lib/db/repositories/glyph.repository"
import connectToDatabase from "@/lib/db/connect"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const glyphRepo = new GlyphRepository()

    const glyph = await glyphRepo.findById(params.id)

    if (!glyph) {
      return NextResponse.json({ error: "Glyph not found" }, { status: 404 })
    }

    return NextResponse.json({ glyph })
  } catch (error) {
    console.error("Error fetching glyph:", error)
    return NextResponse.json({ error: "Failed to fetch glyph" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const glyph = await glyphRepo.update(params.id, body)

    if (!glyph) {
      return NextResponse.json({ error: "Glyph not found" }, { status: 404 })
    }

    return NextResponse.json({ glyph })
  } catch (error) {
    console.error("Error updating glyph:", error)
    return NextResponse.json({ error: "Failed to update glyph" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const glyphRepo = new GlyphRepository()

    const success = await glyphRepo.delete(params.id)

    if (!success) {
      return NextResponse.json({ error: "Glyph not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting glyph:", error)
    return NextResponse.json({ error: "Failed to delete glyph" }, { status: 500 })
  }
}

