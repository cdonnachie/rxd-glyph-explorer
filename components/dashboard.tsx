"use client"

import type React from "react"
import { useEffect, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Layers, FileText, Database, Package, Users, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getStats, refreshStats, type StatsData } from "@/lib/actions/stats-actions"
import Link from "next/link"

export function Dashboard() {
  // Replace the entire useEffect block with this implementation that uses a separate loading state
  // This allows the glyphs to load independently of the stats

  const [statsLoading, setStatsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load stats on initial render with a separate loading state
  useEffect(() => {
    const loadInitialStats = async () => {
      try {
        setStatsLoading(true)
        const data = await getStats()
        setStats(data)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch stats:", err)
        setError("Failed to load blockchain statistics")
      } finally {
        setStatsLoading(false)
      }
    }

    // Start loading stats but don't block the rest of the UI
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
        console.error("Failed to refresh stats:", err)
        setError("Failed to refresh blockchain statistics")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Blockchain Overview</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={statsLoading || isPending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading || isPending ? "animate-spin" : ""}`} />
          {statsLoading || isPending ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Glyphs"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          isLoading={statsLoading || isPending}
          error={error}
        >
          {stats && (
            <>
              <div className="text-2xl font-bold">{stats.glyphs.total}</div>
              <p className="text-xs text-muted-foreground">
                NFT: {stats.glyphs.nft} | FT: {stats.glyphs.ft} | DAT: {stats.glyphs.dat}
              </p>
            </>
          )}
        </StatCard>

        <StatCard
          title="Containers"
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
          isLoading={statsLoading || isPending}
          error={error}
        >
          {stats && (
            <>
              <div className="text-2xl font-bold">{stats.glyphs.containers}</div>
              <p className="text-xs text-muted-foreground">Items in containers: {stats.glyphs.containedItems}</p>
            </>
          )}
        </StatCard>

        <StatCard
          title="Users"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          isLoading={statsLoading || isPending}
          error={error}
        >
          {stats && (
            <>
              <div className="text-2xl font-bold">{stats.glyphs.users}</div>
              <p className="text-xs text-muted-foreground">Registered blockchain users</p>
            </>
          )}
        </StatCard>

        <StatCard
          title="Block Height"
          icon={<Layers className="h-4 w-4 text-muted-foreground" />}
          isLoading={statsLoading || isPending}
          error={error}
        >
          {stats && (
            <>
              <div className="text-2xl font-bold">
                {stats.blocks.latest ? (
                  <Link
                    href={`${process.env.NEXT_PUBLIC_RXD_EXPLORER_BLOCK_URL}${stats.blocks.latest.height}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline"
                  >
                    {stats.blocks.latest.height}
                  </Link>
                ) : (
                  "N/A"
                )}
              </div>              <p className="text-xs text-muted-foreground">Total Blocks: {stats.blocks.count}</p>
            </>
          )}
        </StatCard>

        <StatCard
          title="Latest Block"
          icon={<Database className="h-4 w-4 text-muted-foreground" />}
          isLoading={statsLoading || isPending}
          error={error}
        >
          {stats && stats.blocks.latest ? (
            <>
              <div className="text-sm font-medium truncate">
                <Link
                  href={`${process.env.NEXT_PUBLIC_RXD_EXPLORER_BLOCK_URL}${stats.blocks.latest.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  {stats.blocks.latest.hash.substring(0, 10)}...
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">{stats.blocks.latest.timestamp}</p>
            </>
          ) : (
            <div className="text-sm">No blocks found</div>
          )}
        </StatCard>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  isLoading: boolean
  error: string | null
}

// Update the StatCard component to use statsLoading instead of isLoading
function StatCard({ title, icon, children, isLoading, error }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3" />
          </>
        ) : error ? (
          <div className="text-sm text-destructive">Failed to load data</div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
