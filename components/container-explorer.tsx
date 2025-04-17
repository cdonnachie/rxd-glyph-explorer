"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GlyphGrid } from "@/components/glyph-grid"
import { GlyphDetail } from "@/components/glyph-detail"
import { Search, RefreshCw, Package } from "lucide-react"
import type { GlyphUI } from "@/lib/services/glyph-service"
import { Card, CardContent } from "@/components/ui/card"
import { fetchContainers, fetchGlyphById } from "@/lib/actions/glyph-actions"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

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

export function ContainerExplorer() {
  const [containers, setContainers] = useState<GlyphUI[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedContainer, setSelectedContainer] = useState<GlyphUI | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [showSpent, setShowSpent] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const loadContainers = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setIsLoading(true)
      }
      setError(null)

      const currentSkip = loadMore ? skip : 0
      const fetchedContainers = await fetchContainers(50, currentSkip, showSpent)

      // Filter by search query if provided
      const filteredContainers = searchQuery
        ? fetchedContainers.filter(
            (container) =>
              container.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              container.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              container.creator.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : fetchedContainers

      // Check if there are more items to load
      setHasMore(fetchedContainers.length === 50)

      // Update skip for next load
      if (loadMore) {
        setContainers((prevContainers) => {
          // Create a map of existing IDs for faster lookup
          const existingIds = new Set(prevContainers.map((c) => c.id))

          // Only add containers that don't already exist in the array
          const newContainers = filteredContainers.filter((container) => !existingIds.has(container.id))

          return [...prevContainers, ...newContainers]
        })
        // Don't update skip here, it's already been updated in handleLoadMore
      } else {
        setSkip(50)
        setContainers(filteredContainers)
      }
    } catch (err) {
      console.error("Failed to fetch containers:", err)
      setError("Failed to load containers. Please try again.")
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    setSkip(0) // Reset skip when component mounts or showSpent changes
    loadContainers()
  }, [showSpent])

  // Apply search filter client-side for better UX
  useEffect(() => {
    if (searchQuery && containers.length > 0) {
      const filteredContainers = containers.filter(
        (container) =>
          container.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          container.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          container.creator.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setContainers(filteredContainers)
    } else if (!searchQuery) {
      // If search query is cleared, reload all containers
      loadContainers()
    }
  }, [searchQuery])

  useEffect(() => {
    // Sort the containers based on sort option
    const sortedContainers = [...containers]

    switch (sortBy) {
      case "newest":
        sortedContainers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case "oldest":
        sortedContainers.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case "alphabetical":
        sortedContainers.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    setContainers(sortedContainers)
  }, [sortBy])

  const handleContainerSelect = async (container: GlyphUI) => {
    startTransition(async () => {
      try {
        // Fetch container with its items
        const detailedContainer = await fetchGlyphById(container.id, true)
        setSelectedContainer(detailedContainer)
      } catch (err) {
        console.error("Failed to fetch container details:", err)
        setSelectedContainer(container) // Fallback to the basic container data
      }
    })
  }

  const handleCloseDetail = () => {
    setSelectedContainer(null)
  }

  const handleRefresh = () => {
    setSkip(0)
    loadContainers()
  }

  const handleLoadMore = useCallback(() => {
    // Prevent multiple simultaneous load operations
    if (isLoadingMore || isPending) return

    setIsLoadingMore(true)
    setSkip(skip + 50)
    loadContainers(true).finally(() => {
      setIsLoadingMore(false)
    })
  }, [isLoadingMore, isPending, skip])

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
    }, 200), // 200ms debounce delay
    [hasMore, isLoading, isPending, isLoadingMore, handleLoadMore],
  )

  useEffect(() => {
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  return (
    <div className="space-y-6">
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
          <Switch id="show-spent" checked={showSpent} onCheckedChange={setShowSpent} />
          <Label htmlFor="show-spent" className="text-sm">
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

      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Containers ({containers.length})</h2>
      </div>

      {isLoading && containers.length === 0 ? (
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
      ) : containers.length > 0 ? (
        <GlyphGrid glyphs={containers} onGlyphSelect={handleContainerSelect} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No containers found matching your search criteria.</p>
        </div>
      )}

      {!isLoading && !error && containers.length > 0 && (
        <div className="mt-6 text-center space-y-2">
          <div className="text-sm text-muted-foreground">
            Showing {containers.length} containers {hasMore && "- Scroll down to load more"}
          </div>

          {hasMore && (
            <>
              <Button
                onClick={handleLoadMore}
                variant="outline"
                className="px-8 relative transition-all duration-300 ease-in-out"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="mt-4 text-center">
                    <div className="inline-block animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                    <p className="text-sm text-muted-foreground mt-2">Loading more containers...</p>
                  </div>
                ) : (
                  <>Load More</>
                )}
              </Button>
            </>
          )}

          {!hasMore && containers.length > 50 && (
            <div className="text-sm text-muted-foreground">You've reached the end of the results</div>
          )}
        </div>
      )}

      {selectedContainer && (
        <GlyphDetail glyph={selectedContainer} onClose={handleCloseDetail} onGlyphSelect={handleContainerSelect} />
      )}
    </div>
  )
}
