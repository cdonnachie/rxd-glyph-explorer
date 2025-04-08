"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, Download } from "lucide-react"

interface ImportLogsProps {
  apiKey: string
}

// This is a placeholder component since we don't have a direct API to fetch logs
// In a real application, you would implement an API endpoint to fetch logs from the server
export function ImportLogs({ apiKey }: ImportLogsProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Placeholder function to fetch logs
  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // In a real application, you would fetch logs from an API endpoint
      // For now, we'll just simulate some logs
      const simulatedLogs = [
        "[2023-07-01 12:00:00] [INFO] Starting blockchain import",
        "[2023-07-01 12:00:01] [INFO] Current blockchain height: 1000",
        "[2023-07-01 12:00:01] [INFO] Last imported height: 950",
        "[2023-07-01 12:00:01] [INFO] Importing blocks from 951 to 960",
        "[2023-07-01 12:00:02] [INFO] Processing block 951",
        "[2023-07-01 12:00:03] [INFO] Imported block 951/960",
        "[2023-07-01 12:00:04] [INFO] Processing block 952",
        "[2023-07-01 12:00:05] [INFO] Imported block 952/960",
        "[2023-07-01 12:00:06] [INFO] Processing block 953",
        "[2023-07-01 12:00:07] [INFO] Imported block 953/960",
      ]

      setLogs(simulatedLogs)
    } catch (err) {
      console.error("Error fetching logs:", err)
      setError("Failed to fetch logs")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [apiKey])

  const handleDownloadLogs = () => {
    // Create a blob with the logs
    const blob = new Blob([logs.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    // Create a link and click it to download the logs
    const a = document.createElement("a")
    a.href = url
    a.download = `import-logs-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Import Logs</CardTitle>
            <CardDescription>Recent logs from the import process</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadLogs} disabled={isLoading || logs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Download
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

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : logs.length > 0 ? (
          <div className="bg-muted rounded-md p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className="pb-1">
                {log}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">No logs found</div>
        )}
      </CardContent>
    </Card>
  )
}

