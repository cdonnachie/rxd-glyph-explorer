"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GlyphGrid } from "@/components/glyph-grid"
import { GlyphDetail } from "@/components/glyph-detail"
import { Search, Filter, RefreshCw, Package } from "lucide-react"
import type { GlyphUI } from "@/lib/services/glyph-service"
import { GlyphType } from "@/lib/db/models/enums"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchGlyphs, fetchGlyphById } from "@/lib/actions/glyph-actions"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { UserDetail } from "@/components/user-detail"
import { fetchGlyphByRef } from "@/lib/actions/glyph-actions"

// Debounce function to limit how often a function can be called
function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function GlyphExplorer() {
  const [glyphs, setGlyphs] = useState<GlyphUI[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [tokenTypeFilter, setTokenTypeFilter] = useState<GlyphType | "">("")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedGlyph, setSelectedGlyph] = useState<GlyphUI | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [showSpent, setShowSpent] = useState(false)
  const [selectedUser, setSelectedUser] = useState<GlyphUI | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const handleTabChange = (tab: string) => {
    setGlyphs([])
    setSkip(0)
    setActiveTab(tab)
  }

  const handleFilterChange = (filterType: GlyphType | 'all') => {
    setGlyphs([])
    setTokenTypeFilter(filterType as GlyphType || "")    
    setSkip(0)
  }

  const loadGlyphs = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setIsLoading(true)
      }
      setError(null)

      const tokenType = tokenTypeFilter || "all"
      const currentSkip = loadMore ? skip : 0

      let fetchedGlyphs: GlyphUI[]

      if (activeTab === "containers") {
        // Fetch only containers
        fetchedGlyphs = await fetchGlyphs(searchQuery, tokenType, 50, currentSkip, true, false, showSpent)
      } else {
        // Fetch all glyphs or by search/filter
        fetchedGlyphs = await fetchGlyphs(searchQuery, tokenType, 50, currentSkip, false, false, showSpent)
      }

      // Check if there are more items to load
      setHasMore(fetchedGlyphs.length === 50)

      // Update skip for next load
      if (loadMore) {
        setGlyphs((prevGlyphs) => {
          // Create a map of existing IDs for faster lookup
          const existingIds = new Set(prevGlyphs.map((g) => g.id))

          // Only add glyphs that don't already exist in the array
          const newGlyphs = fetchedGlyphs.filter((glyph) => !existingIds.has(glyph.id))

          return [...prevGlyphs, ...newGlyphs]
        })
      } else {
        setSkip(50)
        setGlyphs(fetchedGlyphs)
      }
    } catch (err) {
      console.error("Failed to fetch glyphs:", err)
      setError("Failed to load glyphs. Please try again.")
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    loadGlyphs()
  }, [activeTab, showSpent])

  useEffect(() => {
    if (searchQuery !== "" || tokenTypeFilter !== "") {
      const timer = setTimeout(() => {
        setSkip(0)
        loadGlyphs()
      }, 300)
      return () => clearTimeout(timer)
    }
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
      case "alphabetical":
        sortedGlyphs.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    setGlyphs(sortedGlyphs)
  }, [sortBy])

  const handleGlyphSelect = async (glyph: GlyphUI) => {
    startTransition(async () => {
      try {
        if (glyph.tokenType.toLowerCase() === "user") {
          setSelectedUser(glyph)
          setSelectedGlyph(null)
        } else {
          if (glyph.isContainer) {
            const detailedGlyph = await fetchGlyphById(glyph.id, true)
            setSelectedGlyph(detailedGlyph)
          } else {
            setSelectedGlyph(glyph)
          }
          setSelectedUser(null)
        }
      } catch (err) {
        console.error("Failed to fetch glyph details:", err)
        // Fallback to the basic glyph data
        if (glyph.tokenType.toLowerCase() === "user") {
          setSelectedUser(glyph)
          setSelectedGlyph(null)
        } else {
          setSelectedGlyph(glyph)
          setSelectedUser(null)
        }
      }
    })
  }

  const handleCreatorClick = async (creator: string) => {
    startTransition(async () => {
      try {
        const creatorGlyphs = await fetchGlyphByRef(creator)
        if (creatorGlyphs && creatorGlyphs.length > 0) {
          handleGlyphSelect(creatorGlyphs[0])
        }
      } catch (err) {
        console.error("Failed to fetch creator details:", err)
      }
    })
  }

  const handleCloseDetail = () => {
    setSelectedGlyph(null)
    setSelectedUser(null)
  }

  const handleRefresh = () => {
    setSkip(0)
    loadGlyphs()
  }

  const handleLoadMore = () => {
    if (isLoadingMore || isPending) return

    setIsLoadingMore(true)
    setSkip(skip + 50)
    loadGlyphs(true).finally(() => {
      setIsLoadingMore(false)
    })
  }

  const handleScroll = useCallback(
    debounce(() => {
      if (typeof window !== "undefined") {
        const scrollPosition = window.innerHeight + window.scrollY
        const pageHeight = document.body.offsetHeight
        const scrollThreshold = 0.9 // Increased from 0.8 to 0.9 to load closer to bottom

        if (scrollPosition >= pageHeight * scrollThreshold && hasMore && !isLoading && !isPending && !isLoadingMore) {
          handleLoadMore()
        }
      }
    }, 2000), // 200ms debounce delay
    [hasMore, isLoading, isPending, isLoadingMore, handleLoadMore],
  )

  useEffect(() => {
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Glyphs</TabsTrigger>
          <TabsTrigger value="containers">
            <Package className="h-4 w-4 mr-2" />
            Containers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
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
              <Select
                value={tokenTypeFilter || "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    handleFilterChange("all")
                  } else {
                    handleFilterChange(value as GlyphType)
                  }
                }}
              >
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
            <div className="flex items-center gap-2 ml-2">
              <Switch id="show-spent" checked={showSpent} onCheckedChange={setShowSpent} />
              <Label htmlFor="show-spent" className="text-sm">
                Show spent glyphs
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading || isPending}
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading || isPending ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="containers" className="mt-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search containers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Switch id="show-spent-containers" checked={showSpent} onCheckedChange={setShowSpent} />
              <Label htmlFor="show-spent-containers" className="text-sm">
                Show spent containers
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading || isPending}
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading || isPending ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {isLoading && glyphs.length === 0 ? (
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
        <GlyphGrid glyphs={glyphs} onGlyphSelect={handleGlyphSelect} onCreatorClick={handleCreatorClick} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No glyphs found matching your search criteria.</p>
        </div>
      )}

      {!isLoading && !error && glyphs.length > 0 && (
        <div className="mt-6 text-center space-y-2">
          <div className="text-sm text-muted-foreground">
            Showing {glyphs.length} glyphs {hasMore && "- Scroll down to load more"}
          </div>

          {hasMore && (
            <Button
              onClick={handleLoadMore}
              variant="outline"
              className="px-8 relative transition-all duration-300 ease-in-out"
              disabled={isPending || isLoadingMore}
            >
              {isPending || isLoadingMore ? (
                <>
                  <div className="mt-4 text-center">
                    <div className="inline-block animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                    <p className="text-sm text-muted-foreground mt-2">Loading more glyphs...</p>
                  </div>
                </>
              ) : (
                <>Load More</>
              )}
            </Button>
          )}

          {!hasMore && glyphs.length > 50 && (
            <div className="text-sm text-muted-foreground">You've reached the end of the results</div>
          )}
        </div>
      )}

      {selectedGlyph && (
        <GlyphDetail glyph={selectedGlyph} onClose={handleCloseDetail} onGlyphSelect={handleGlyphSelect} />
      )}
      {selectedUser && <UserDetail user={selectedUser} onClose={handleCloseDetail} />}
    </div>
  )
}
