import { fetchGlyphByRef } from "../actions/glyph-actions"

const nameCache = new Map<string, string>()

const getGlyphName = async (ref: string): Promise<string> => {
  // Return from cache if available
  if (nameCache.has(ref)) {
    return nameCache.get(ref)!
  }

  try {
    const glyphs = await fetchGlyphByRef(ref)
    if (glyphs.length > 0) {
      const creatorGlyph = glyphs[0]
      // Store in cache for future use
      nameCache.set(ref, creatorGlyph.name)
      return creatorGlyph.name
    } else {
      // Cache negative results too
      nameCache.set(ref, ref)
      return ref
    }
  } catch (error) {
    console.error("Error fetching ref:", error)
    // Cache errors as the ref itself
    nameCache.set(ref, ref)
    return ref
  }
}

const batchGetGlyphNames = async (refs: string[]): Promise<Map<string, string>> => {
  // Filter out refs that are already in cache
  const missingRefs = refs.filter((ref) => !nameCache.has(ref))

  // If all refs are in cache, return immediately
  if (missingRefs.length === 0) {
    const result = new Map<string, string>()
    refs.forEach((ref) => {
      result.set(ref, nameCache.get(ref)!)
    })
    return result
  }

  // Otherwise, fetch the missing refs
  try {
    // This would be more efficient with a custom repository method that accepts an array of refs
    // For now, we'll use Promise.all but this could be optimized further
    const promises = missingRefs.map(async (ref) => {
      const glyphs = await fetchGlyphByRef(ref)
      if (glyphs.length > 0) {
        nameCache.set(ref, glyphs[0].name)
        return { ref, name: glyphs[0].name }
      } else {
        nameCache.set(ref, ref)
        return { ref, name: ref }
      }
    })

    const results = await Promise.all(promises)

    // Combine with cached results
    const nameMap = new Map<string, string>()
    refs.forEach((ref) => {
      nameMap.set(ref, nameCache.has(ref) ? nameCache.get(ref)! : ref)
    })

    // Update cache with new results
    results.forEach(({ ref, name }) => {
      nameMap.set(ref, name)
      nameCache.set(ref, name)
    })

    return nameMap
  } catch (error) {
    console.error("Error batch fetching refs:", error)
    // Return a map with default values for missing refs
    const nameMap = new Map<string, string>()
    refs.forEach((ref) => {
      nameMap.set(ref, nameCache.has(ref) ? nameCache.get(ref)! : ref)
    })
    return nameMap
  }
}

// Define the frontend Glyph type that matches our UI needs
export interface GlyphUI {
  id: string
  name: string
  description: string
  imageUrl?: string
  image?: string
  embedType?: string
  remote?: {
    type: string
    url: string
    hash?: string
    hashSignature?: string
  }
  contentLength?: number
  contentType?: string
  creator: string
  creatorName?: string
  createdAt: string
  transactionHash?: string
  blockNumber?: number
  tokenType: string
  attributes?: {
    trait_type: string
    value: string | number
  }[]
  ref: string
  isContainer?: boolean
  containerRef?: string
  containerName?: string
  containerItems?: GlyphUI[]
  spent?: boolean
}


// Export the mapDbGlyphToUi function for use in Server Actions
export async function mapDbGlyphToUi(dbGlyph: any, containerItems: any[] = []): Promise<GlyphUI> {
  // Get both names in one batch if possible
  const refsToFetch = [dbGlyph.author]
  if (dbGlyph.container) {
    refsToFetch.push(dbGlyph.container)
  }

  const nameMap = await batchGetGlyphNames(refsToFetch)
  const creatorName = nameMap.get(dbGlyph.author) || dbGlyph.author
  const containerName = dbGlyph.container ? nameMap.get(dbGlyph.container) : undefined

  return {
    id: dbGlyph._id.toString(),
    name: dbGlyph.name,
    description: dbGlyph.description,
    imageUrl: dbGlyph.remote?.u || "/radiant-logo.png?height=400&width=400",
    creator: dbGlyph.author,
    creatorName: creatorName,
    createdAt: dbGlyph.timestamp ? new Date(dbGlyph.timestamp * 1000).toISOString() : new Date().toISOString(),
    transactionHash: dbGlyph.revealOutpoint?.split(":")[0],
    blockNumber: dbGlyph.height,
    tokenType: dbGlyph.tokenType,
    image: dbGlyph.embed?.b
      ? `data:${dbGlyph.embed.t};base64,${Buffer.from(dbGlyph.embed.b, "base64").toString("base64")}`
      : undefined,
    attributes: dbGlyph.attrs
      ? Array.from(dbGlyph.attrs.entries() as Iterable<[string, string | number]>).map(([trait_type, value]) => ({
        trait_type,
        value,
      }))
      : undefined,
    embedType: dbGlyph.embed?.t || undefined,
    remote: dbGlyph.remote
      ? {
        type: dbGlyph.remote.t,
        url: dbGlyph.remote.u,
        hash: dbGlyph.remote.h ? Buffer.from(dbGlyph.remote.h).toString("base64") : undefined,
        hashSignature: dbGlyph.remote.hs ? Buffer.from(dbGlyph.remote.hs).toString("base64") : undefined,
      }
      : undefined,
    ref: dbGlyph.ref,
    isContainer: dbGlyph.isContainer || dbGlyph.tokenType === "CONTAINER",
    containerRef: dbGlyph.container !== "Unknown" ? dbGlyph.container : undefined,
    containerName: containerName,
    containerItems:
      containerItems.length > 0 ? await Promise.all(containerItems.map((item) => mapDbGlyphToUi(item))) : undefined,
    spent: dbGlyph.spent === 1,
  }
}
