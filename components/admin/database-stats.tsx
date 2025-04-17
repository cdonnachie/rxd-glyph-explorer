"use client"

import { useEffect, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, FileText, Coins, Layers, Package, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { getStats, refreshStats, type StatsData } from "@/lib/actions/stats-actions"

export function DatabaseStats() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Load stats on initial render
  useEffect(() => {
    const loadInitialStats = async () => {
      try {
        setIsLoading(true)
        const data = await getStats()
        setStats(data)
        setError(null)
      } catch (err) {
        setError("Failed to load blockchain statistics")
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialStats()
  }, [])

  // Handle manual refresh with the refresh button
  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const freshStats = await refreshStats()
        setStats(freshStats)
        setError(null)
      } catch (err) {
        setError("Failed to refresh blockchain statistics")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Database Statistics</h3>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading || isPending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading || isPending ? "animate-spin" : ""}`} />
          {isLoading || isPending ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading || isPending ? (
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Skeleton className="h-4 w-4 mr-2" />
                  <Skeleton className="h-4 w-20" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                  <div>
                    <Skeleton className="h-4 w-8 mb-1" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-8 mb-1" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-8 mb-1" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Glyphs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.glyphs.total}</div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                <div>
                  <div className="text-muted-foreground">NFT</div>
                  <div className="font-medium">{stats.glyphs.nft}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">FT</div>
                  <div className="font-medium">{stats.glyphs.ft}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">DAT</div>
                  <div className="font-medium">{stats.glyphs.dat}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Containers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.glyphs.containers}</div>
              <div className="mt-2 text-sm">
                <div className="text-muted-foreground">Items in Containers</div>
                <div className="font-medium">{stats.glyphs.containedItems}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.glyphs.users}</div>
              <div className="mt-2 text-sm">
                <div className="text-muted-foreground">Registered Users</div>
                <div className="font-medium">{stats.glyphs.users}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Coins className="h-4 w-4 mr-2" />
                Transaction Outputs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.txos.total}</div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                <div>
                  <div className="text-muted-foreground">RXD</div>
                  <div className="font-medium">{stats.txos.rxd}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">NFT</div>
                  <div className="font-medium">{stats.txos.nft}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">FT</div>
                  <div className="font-medium">{stats.txos.ft}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Layers className="h-4 w-4 mr-2" />
                Blocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.blocks.count}</div>
              {stats.blocks.latest && (
                <div className="mt-2 text-sm">
                  <div className="text-muted-foreground">Latest Block</div>
                  <div className="font-medium">Height: {stats.blocks.latest.height}</div>
                  <div className="text-muted-foreground truncate">
                    Hash: {stats.blocks.latest.hash.substring(0, 10)}...
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">No statistics available</div>
      )}
    </div>
  )
}
