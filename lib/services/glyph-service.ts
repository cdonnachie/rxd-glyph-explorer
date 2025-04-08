import { GlyphType } from "../db/models/enums"

// Define the frontend Glyph type that matches our UI needs
export interface GlyphUI {
  id: string
  name: string
  description: string
  imageUrl?: string
  creator: string
  createdAt: string
  transactionHash?: string
  blockNumber?: number
  rarity?: number
  tokenType: string
  attributes?: {
    trait_type: string
    value: string | number
  }[]
  ref: string
}

// Convert DB Glyph to UI Glyph
export function mapDbGlyphToUi(dbGlyph: any): GlyphUI {
  return {
    id: dbGlyph._id,
    name: dbGlyph.name,
    description: dbGlyph.description,
    imageUrl: dbGlyph.remote?.u || "/placeholder.svg?height=400&width=400",
    creator: dbGlyph.author,
    createdAt: dbGlyph.createdAt || new Date().toISOString(),
    transactionHash: dbGlyph.revealOutpoint?.split(":")[0],
    blockNumber: dbGlyph.height,
    rarity: calculateRarity(dbGlyph),
    tokenType: dbGlyph.tokenType,
    attributes: Object.entries(dbGlyph.attrs || {}).map(([trait_type, value]) => ({
      trait_type,
      value,
    })),
    ref: dbGlyph.ref,
  }
}

// Calculate a rarity score based on glyph properties
function calculateRarity(glyph: any): number {
  // This is a placeholder implementation
  // In a real app, you would have a more sophisticated algorithm
  let score = 50 // Base score

  // Adjust based on token type
  if (glyph.tokenType === GlyphType.NFT) score += 20
  if (glyph.tokenType === GlyphType.DAT) score += 10

  // Adjust based on immutability
  if (glyph.immutable) score += 10

  // Adjust based on attributes count
  const attrCount = Object.keys(glyph.attrs || {}).length
  score += Math.min(attrCount * 2, 10)

  return Math.min(score, 100)
}

export async function fetchGlyphs(
  searchQuery?: string,
  tokenType?: GlyphType,
  limit = 50,
  skip = 0,
): Promise<GlyphUI[]> {
  try {
    let url = `/api/glyphs?limit=${limit}&skip=${skip}`

    if (searchQuery) {
      url += `&query=${encodeURIComponent(searchQuery)}`
    }

    if (tokenType) {
      url += `&tokenType=${encodeURIComponent(tokenType)}`
    }

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Error fetching glyphs: ${response.statusText}`)
    }

    const data = await response.json()
    return (data.glyphs || []).map(mapDbGlyphToUi)
  } catch (error) {
    console.error("Error fetching glyphs:", error)
    throw error
  }
}

export async function fetchGlyphById(id: string): Promise<GlyphUI> {
  try {
    const response = await fetch(`/api/glyphs/${id}`)

    if (!response.ok) {
      throw new Error(`Error fetching glyph: ${response.statusText}`)
    }

    const data = await response.json()
    return mapDbGlyphToUi(data.glyph)
  } catch (error) {
    console.error(`Error fetching glyph with ID ${id}:`, error)
    throw error
  }
}

export async function fetchStats() {
  try {
    const response = await fetch("/api/stats")

    if (!response.ok) {
      throw new Error(`Error fetching stats: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching stats:", error)
    throw error
  }
}

