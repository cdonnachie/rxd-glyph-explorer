"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Play, RefreshCw, Database, Clock, Hash, RotateCcw, AlertTriangle } from "lucide-react"

interface ImportState {
  lastBlockHeight: number
  lastBlockHash: string
  lastUpdated: string
  isImporting: boolean
}

interface ImportControlsProps {
  apiKey: string
}

export function ImportControls({ apiKey }: ImportControlsProps) {
  const [importState, setImportState] = useState<ImportState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetBlockHeight, setResetBlockHeight] = useState("")
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const fetchImportState = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/admin/import", {
        headers: {
          "x-api-key": apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch import state: ${response.statusText}`)
      }

      const data = await response.json()
      setImportState(data)
    } catch (err) {
      console.error("Error fetching import state:", err)
      setError("Failed to fetch import state")
    } finally {
      setIsLoading(false)
    }
  }

  const startImport = async (resetToBlock?: number) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/admin/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(resetToBlock !== undefined ? { resetToBlock } : {}),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to start import: ${response.statusText}`)
      }

      await fetchImportState()
    } catch (err: any) {
      console.error("Error starting import:", err)
      setError(err.message || "Failed to start import")
    } finally {
      setIsLoading(false)
    }
  }

  const resetImportFlag = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/admin/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ resetImportFlag: true }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to reset import flag: ${response.statusText}`)
      }

      await fetchImportState()
    } catch (err: any) {
      console.error("Error resetting import flag:", err)
      setError(err.message || "Failed to reset import flag")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartImport = () => {
    startImport()
  }

  const handleResetAndImport = () => {
    const blockHeight = Number.parseInt(resetBlockHeight)
    if (isNaN(blockHeight) || blockHeight < 0) {
      setError("Please enter a valid block height")
      return
    }

    startImport(blockHeight)
    setResetBlockHeight("")
  }

  useEffect(() => {
    fetchImportState()

    // Set up auto-refresh if import is running
    const interval = setInterval(() => {
      if (importState?.isImporting) {
        fetchImportState()
      }
    }, 5000) // Refresh every 5 seconds if import is running

    setRefreshInterval(interval)

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [apiKey, importState?.isImporting])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Status</CardTitle>
          <CardDescription>Current status of the blockchain import process</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && !importState ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : importState ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Import Status:</span>
                <Badge variant={importState.isImporting ? "default" : "outline"}>
                  {importState.isImporting ? "Running" : "Idle"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last Block Height:</span>
                <span className="font-medium">{importState.lastBlockHeight}</span>
              </div>

              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last Block Hash:</span>
                <span className="font-medium truncate">{importState.lastBlockHash || "N/A"}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium">
                  {importState.lastUpdated ? new Date(importState.lastUpdated).toLocaleString() : "N/A"}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No import state found</div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={fetchImportState} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <div className="flex gap-2">
            {importState?.isImporting && (
              <Button variant="outline" size="sm" onClick={resetImportFlag} disabled={isLoading}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reset Flag
              </Button>
            )}
            <Button onClick={handleStartImport} disabled={isLoading || (importState?.isImporting ?? false)}>
              <Play className="h-4 w-4 mr-2" />
              Start Import
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset Import</CardTitle>
          <CardDescription>Reset the import process to a specific block height</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Block height"
              value={resetBlockHeight}
              onChange={(e) => setResetBlockHeight(e.target.value)}
              min="0"
            />
            <Button onClick={handleResetAndImport} disabled={isLoading || (importState?.isImporting ?? false)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset & Import
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Warning: This will reset the import process to the specified block height and start importing from there.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

