"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle } from "lucide-react"
import { ImportControls } from "./import-controls"
import { ImportLogs } from "./import-logs"
import { DatabaseStats } from "./database-stats"

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("import")
  const [apiKey, setApiKey] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if API key is stored in localStorage
  useEffect(() => {
    const storedApiKey = localStorage.getItem("adminApiKey")
    if (storedApiKey) {
      setApiKey(storedApiKey)
      setIsAuthenticated(true)
    }
  }, [])

  const handleAuthenticate = () => {
    if (!apiKey.trim()) {
      setError("API key is required")
      return
    }

    // Store API key in localStorage
    localStorage.setItem("adminApiKey", apiKey)
    setIsAuthenticated(true)
    setError(null)
  }

  const handleLogout = () => {
    localStorage.removeItem("adminApiKey")
    setApiKey("")
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Admin Authentication</CardTitle>
          <CardDescription>Enter your API key to access the admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAuthenticate} className="w-full">
            Authenticate
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">Import Control</TabsTrigger>
          <TabsTrigger value="logs">Import Logs</TabsTrigger>
          <TabsTrigger value="stats">Database Stats</TabsTrigger>
        </TabsList>
        <TabsContent value="import" className="mt-6">
          <ImportControls apiKey={apiKey} />
        </TabsContent>
        <TabsContent value="logs" className="mt-6">
          <ImportLogs apiKey={apiKey} />
        </TabsContent>
        <TabsContent value="stats" className="mt-6">
          <DatabaseStats />
        </TabsContent>
      </Tabs>
    </div>
  )
}

