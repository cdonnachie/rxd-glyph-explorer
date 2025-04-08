"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, FileText, Coins, Layers } from "lucide-react"
import { fetchStats } from "@/lib/services/glyph-service"

interface Stats {
  glyphs: {
    total: number
    nft: number
    ft: number
    dat: number
  }
  txos: {
    total: number
    rxd: number
    nft: number
    ft: number
  }
  blocks: {
    count: number
    latest: {
      hash: string
      height: number
      timestamp: string
    } | null
  }
}

export function DatabaseStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const data = await fetchStats()
      setStats(data)
    } catch (err) {
      console.error("Failed to fetch stats:", err)
      setError("Failed to load blockchain statistics")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Database Statistics</h3>
        <Button variant="outline" size="sm" onClick={loadStats} disabled={isLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-3">
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

