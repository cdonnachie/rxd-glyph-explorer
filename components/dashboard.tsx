"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchStats } from "@/lib/services/glyph-service"
import { Layers, Coins, FileText, Database } from "lucide-react"

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

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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

    loadStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Glyphs</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.glyphs.total}</div>
          <p className="text-xs text-muted-foreground">
            NFT: {stats.glyphs.nft} | FT: {stats.glyphs.ft} | DAT: {stats.glyphs.dat}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total TXOs</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.txos.total}</div>
          <p className="text-xs text-muted-foreground">
            RXD: {stats.txos.rxd} | NFT: {stats.txos.nft} | FT: {stats.txos.ft}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Block Height</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.blocks.latest ? stats.blocks.latest.height : "N/A"}</div>
          <p className="text-xs text-muted-foreground">Total Blocks: {stats.blocks.count}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Latest Block</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {stats.blocks.latest ? (
            <>
              <div className="text-sm font-medium truncate">{stats.blocks.latest.hash.substring(0, 10)}...</div>
              <p className="text-xs text-muted-foreground">
                {new Date(stats.blocks.latest.timestamp).toLocaleString()}
              </p>
            </>
          ) : (
            <div className="text-sm">No blocks found</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

