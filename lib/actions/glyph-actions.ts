"use server"

import { GlyphRepository } from "@/lib/db/repositories/glyph.repository"
import type { GlyphType } from "@/lib/db/models/enums"
import { connectToDatabase } from "@/lib/db/connect"
import { mapDbGlyphToUi, type GlyphUI } from "@/lib/services/glyph-service"
import { cache } from "react"

// Fetch glyphs with various filters
export async function fetchGlyphs(
  searchQuery?: string,
  tokenType?: GlyphType | string,
  limit = 50,
  skip = 0,
  isContainer?: boolean,
  includeContainerItems = false,
  showSpent = false,
): Promise<GlyphUI[]> {
  await connectToDatabase()
  const glyphRepo = new GlyphRepository()

  let glyphs

  const query: Record<string, any> = {}

  // Only show unspent glyphs by default
  if (!showSpent) {
    query.spent = 0
  }

  if (searchQuery) {
    glyphs = await glyphRepo.search(searchQuery, limit, skip, query)
  } else if (tokenType && tokenType !== "all") {
    glyphs = await glyphRepo.findByTokenType(tokenType as GlyphType, limit, skip, query)
  } else if (isContainer) {
    glyphs = await glyphRepo.findContainers(limit, skip, query)
  } else {
    // Use the query object to filter by spent status
    glyphs = await glyphRepo.findAll(limit, skip, query)
  }

  // Process glyphs to include container items if requested
  return await Promise.all(
    glyphs.map(async (glyph) => {
      if (glyph.isContainer) {
        // For containers, always fetch the count of items
        if (includeContainerItems && glyph.containerItems?.length) {
          // If full container items are requested, fetch them
          const containerItems = await glyphRepo.findByContainer(glyph.ref)
          return await mapDbGlyphToUi(glyph, containerItems)
        } else {
          // Otherwise, just get the count
          const containerItemsCount = glyph.containerItems?.length || (await glyphRepo.countByContainer(glyph.ref))

          const glyphWithCount = await mapDbGlyphToUi(glyph)
          if (containerItemsCount > 0) {
            glyphWithCount.containerItems = Array(containerItemsCount).fill({} as GlyphUI)
          }
          return glyphWithCount
        }
      }
      return await mapDbGlyphToUi(glyph)
    }),
  )
}

// Fetch a specific glyph by ID with optional container items
export const fetchGlyphById = cache(async (id: string, includeContainerItems = false): Promise<GlyphUI> => {
  await connectToDatabase()
  const glyphRepo = new GlyphRepository()

  const glyph = await glyphRepo.findById(id)
  if (!glyph) {
    throw new Error(`Glyph not found with ID: ${id}`)
  }

  let containerItems: any = []
  if (includeContainerItems && glyph.isContainer && glyph.containerItems?.length) {
    containerItems = await glyphRepo.findByContainer(glyph.ref)
  }

  return await mapDbGlyphToUi(glyph, containerItems)
})

// Fetch glyphs by reference
export async function fetchGlyphByRef(ref: string): Promise<GlyphUI[]> {
  await connectToDatabase()
  const glyphRepo = new GlyphRepository()

  const glyph = await glyphRepo.findByRef(ref)
  if (!glyph) {
    return []
  }

  return [await mapDbGlyphToUi(glyph)]
}

// Fetch containers
export async function fetchContainers(limit = 50, skip = 0, showSpent = false): Promise<GlyphUI[]> {
  await connectToDatabase()
  const glyphRepo = new GlyphRepository()

  // Build query to filter by spent status if needed
  const query: Record<string, any> = {}
  if (!showSpent) {
    query.spent = 0
  }

  const containers = await glyphRepo.findContainers(limit, skip, query)
  return await Promise.all(
    containers.map(async (container) => {
      // Get the count of items in this container
      const itemCount = container.containerItems?.length || (await glyphRepo.countByContainer(container.ref))

      // Map the container to UI format
      const containerUI = await mapDbGlyphToUi(container)

      // Add empty placeholder items just to have the count
      if (itemCount > 0) {
        containerUI.containerItems = Array(itemCount).fill({} as GlyphUI)
      }

      return containerUI
    }),
  )
}

// Fetch users
export async function fetchUsers(limit = 50, skip = 0, showSpent = false): Promise<GlyphUI[]> {
  await connectToDatabase()
  const glyphRepo = new GlyphRepository()

  const query: Record<string, any> = {}
  if (!showSpent) {
    query.spent = 0
  }
  const users = await glyphRepo.findUsers(limit, skip, query)
  return await Promise.all(users.map((user) => mapDbGlyphToUi(user)))
}

// Fetch glyphs by container
export async function fetchGlyphsByContainer(containerRef: string, limit = 50, skip = 0): Promise<GlyphUI[]> {
  await connectToDatabase()
  const glyphRepo = new GlyphRepository()

  const glyphs = await glyphRepo.findByContainer(containerRef, limit, skip)
  return await Promise.all(glyphs.map((glyph) => mapDbGlyphToUi(glyph)))
}

// Fetch glyphs by author/creator
export async function fetchGlyphsByAuthor(author: string, limit = 50, skip = 0): Promise<GlyphUI[]> {
  await connectToDatabase()
  const glyphRepo = new GlyphRepository()

  const glyphs = await glyphRepo.findByAuthor(author, limit, skip)
  return await Promise.all(glyphs.map((glyph) => mapDbGlyphToUi(glyph)))
}
