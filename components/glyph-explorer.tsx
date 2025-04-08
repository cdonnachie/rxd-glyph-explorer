"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GlyphGrid } from "@/components/glyph-grid"
import { GlyphDetail } from "@/components/glyph-detail"
import { Search, Filter, RefreshCw } from "lucide-react"
import { fetchGlyphs, type GlyphUI } from "@/lib/services/glyph-service"
import { GlyphType } from "@/lib/db/models/enums"
import { Card, CardContent } from "@/components/ui/card"

export function GlyphExplorer() {
  const [glyphs, setGlyphs] = useState<GlyphUI[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [tokenTypeFilter, setTokenTypeFilter] = useState<GlyphType | "">("")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedGlyph, setSelectedGlyph] = useState<GlyphUI | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadGlyphs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const tokenType = tokenTypeFilter as GlyphType | undefined
      const fetchedGlyphs = await fetchGlyphs(searchQuery, tokenType)
      setGlyphs(fetchedGlyphs)
    } catch (err) {
      console.error("Failed to fetch glyphs:", err)
      setError("Failed to load glyphs. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadGlyphs()
  }, [searchQuery, tokenTypeFilter])

  useEffect(() => {
    // Sort the glyphs based on sort option
    const sortedGlyphs = [...glyphs]

    switch (sortBy) {
      case "newest":
        sortedGlyphs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case "oldest":
        sortedGlyphs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case "rarity":
        sortedGlyphs.sort((a, b) => (b.rarity || 0) - (a.rarity || 0))
        break
      case "alphabetical":
        sortedGlyphs.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    setGlyphs(sortedGlyphs)
  }, [sortBy])

  const handleGlyphSelect = (glyph: GlyphUI) => {
    setSelectedGlyph(glyph)
  }

  const handleCloseDetail = () => {
    setSelectedGlyph(null)
  }

  const handleRefresh = () => {
    loadGlyphs()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name, description, or creator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={tokenTypeFilter} onValueChange={(value) => setTokenTypeFilter(value as GlyphType | "")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value={GlyphType.NFT}>NFT</SelectItem>
              <SelectItem value={GlyphType.FT}>FT</SelectItem>
              <SelectItem value={GlyphType.DAT}>DAT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="rarity">Rarity</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleRefresh}>Try Again</Button>
          </CardContent>
        </Card>
      ) : glyphs.length > 0 ? (
        <GlyphGrid glyphs={glyphs} onGlyphSelect={handleGlyphSelect} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No glyphs found matching your search criteria.</p>
        </div>
      )}

      {selectedGlyph && <GlyphDetail glyph={selectedGlyph} onClose={handleCloseDetail} />}
    </div>
  )
}

