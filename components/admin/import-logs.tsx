"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  RefreshCw,
  Download,
  Calendar,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
  Bug,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { LogLevel } from "@/lib/db/models/import-log.model"
import { format } from "date-fns"

interface ImportLogsProps {
  apiKey: string
}

interface Log {
  _id: string
  timestamp: string
  level: LogLevel
  message: string
  details?: any
  blockHeight?: number
  txid?: string
}

interface PaginationInfo {
  total: number
  limit: number
  skip: number
  hasMore: boolean
}

export function ImportLogs({ apiKey }: ImportLogsProps) {
  const [logs, setLogs] = useState<Log[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 100,
    skip: 0,
    hasMore: false,
  })

  // Filter states
  const [level, setLevel] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [blockHeight, setBlockHeight] = useState<string>("")
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  const fetchLogs = async (skipValue = 0) => {
    try {
      setIsLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      params.append("limit", pagination.limit.toString())
      params.append("skip", skipValue.toString())

      if (level !== "all") {
        params.append("level", level)
      }

      if (startDate) {
        params.append("startDate", new Date(startDate).toISOString())
      }

      if (endDate) {
        params.append("endDate", new Date(endDate).toISOString())
      }

      if (blockHeight) {
        params.append("blockHeight", blockHeight)
      }

      const response = await fetch(`/api/admin/logs?${params.toString()}`, {
        headers: {
          "x-api-key": apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`)
      }

      const data = await response.json()
      setLogs(data.logs)
      setPagination(data.pagination)
    } catch (err: any) {
      console.error("Error fetching logs:", err)
      setError(err.message || "Failed to fetch logs")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [apiKey])

  const handleRefresh = () => {
    fetchLogs(pagination.skip)
  }

  const handleFilter = () => {
    fetchLogs(0) // Reset to first page when filtering
  }

  const handleClearFilters = () => {
    setLevel("all")
    setStartDate("")
    setEndDate("")
    setBlockHeight("")
    fetchLogs(0)
  }

  const handleNextPage = () => {
    const newSkip = pagination.skip + pagination.limit
    fetchLogs(newSkip)
  }

  const handlePrevPage = () => {
    const newSkip = Math.max(0, pagination.skip - pagination.limit)
    fetchLogs(newSkip)
  }

  const handleDownloadLogs = () => {
    // Create a blob with the logs
    const logText = logs
      .map(
        (log) =>
          `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.message}${
            log.blockHeight ? ` [Block: ${log.blockHeight}]` : ""
          }${log.txid ? ` [Tx: ${log.txid}]` : ""}`,
      )
      .join("\n")

    const blob = new Blob([logText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    // Create a link and click it to download the logs
    const a = document.createElement("a")
    a.href = url
    a.download = `import-logs-${format(new Date(), "yyyy-MM-dd")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClearOldLogs = async () => {
    if (!confirm("Are you sure you want to delete logs older than 30 days?")) {
      return
    }

    try {
      setIsLoading(true)

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const response = await fetch("/api/admin/logs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ olderThan: thirtyDaysAgo.toISOString() }),
      })

      if (!response.ok) {
        throw new Error(`Failed to clear logs: ${response.statusText}`)
      }

      const data = await response.json()
      alert(`Successfully deleted ${data.deletedCount} logs`)

      // Refresh logs
      fetchLogs(0)
    } catch (err: any) {
      console.error("Error clearing logs:", err)
      setError(err.message || "Failed to clear logs")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleLogDetails = (logId: string) => {
    if (expandedLogId === logId) {
      setExpandedLogId(null)
    } else {
      setExpandedLogId(logId)
    }
  }

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
        return <Badge variant="destructive">ERROR</Badge>
      case LogLevel.WARN:
        return (
          <Badge variant="default" className="bg-yellow-500">
            WARN
          </Badge>
        )
      case LogLevel.INFO:
        return <Badge variant="secondary">INFO</Badge>
      case LogLevel.DEBUG:
        return <Badge variant="outline">DEBUG</Badge>
      default:
        return <Badge variant="outline">{level}</Badge>
    }
  }

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case LogLevel.WARN:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case LogLevel.INFO:
        return <Info className="h-4 w-4 text-blue-500" />
      case LogLevel.DEBUG:
        return <Bug className="h-4 w-4 text-gray-500" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Import Logs</CardTitle>
            <CardDescription>Logs from the blockchain import process</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadLogs} disabled={isLoading || logs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearOldLogs} disabled={isLoading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Old Logs
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Log Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value={LogLevel.ERROR}>Error</SelectItem>
                <SelectItem value={LogLevel.WARN}>Warning</SelectItem>
                <SelectItem value={LogLevel.INFO}>Info</SelectItem>
                <SelectItem value={LogLevel.DEBUG}>Debug</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[150px]"
            />
            <span>to</span>
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[150px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Block Height"
              value={blockHeight}
              onChange={(e) => setBlockHeight(e.target.value)}
              className="w-[120px]"
            />
          </div>

          <Button variant="secondary" size="sm" onClick={handleFilter} disabled={isLoading}>
            Apply Filters
          </Button>

          <Button variant="outline" size="sm" onClick={handleClearFilters} disabled={isLoading}>
            Clear Filters
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2 border rounded-md">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log._id}
                className={`p-2 border rounded-md transition-colors ${
                  expandedLogId === log._id ? "bg-muted" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleLogDetails(log._id)}>
                  {getLevelIcon(log.level)}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                  </span>
                  {getLevelBadge(log.level)}
                  <span className="flex-1 font-mono text-sm truncate">{log.message}</span>
                  {log.blockHeight && (
                    <Badge variant="outline" className="ml-2">
                      Block: {log.blockHeight}
                    </Badge>
                  )}
                </div>

                {expandedLogId === log._id && log.details && (
                  <div className="mt-2 p-2 bg-muted/30 rounded-md">
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {pagination.skip + 1} to {Math.min(pagination.skip + logs.length, pagination.total)} of{" "}
                {pagination.total} logs
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={pagination.skip === 0 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!pagination.hasMore || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No logs found matching your criteria.</div>
        )}
      </CardContent>
    </Card>
  )
}
