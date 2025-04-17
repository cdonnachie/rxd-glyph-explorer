"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Code } from "@/components/ui/code"
import { CopyButton } from "@/components/copy-button"

export function ApiDocumentation() {
  const [activeTab, setActiveTab] = useState("overview")
  const baseUrl = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>RXD Glyph Explorer API</CardTitle>
          <CardDescription>
            This documentation provides details on how to interact with the RXD Glyph Explorer API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            The base URL for all API endpoints is: <Code className="ml-1">{baseUrl}</Code>
            <CopyButton value={baseUrl} className="ml-2" />
          </p>
          <p className="text-sm text-muted-foreground">
            Some endpoints require authentication with an API key. Include the API key in the request headers as{" "}
            <Code>x-api-key</Code>.
          </p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="glyphs">Glyphs</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="blocks">Blocks</TabsTrigger>
          <TabsTrigger value="txos">TXOs</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Endpoints</CardTitle>
              <CardDescription>The RXD Glyph Explorer API provides the following main endpoints:</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Authentication</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Code>/api/glyphs</Code>
                    </TableCell>
                    <TableCell>Fetch and search glyphs</TableCell>
                    <TableCell>No</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Code>/api/glyphs/[id]</Code>
                    </TableCell>
                    <TableCell>Fetch a specific glyph by ID</TableCell>
                    <TableCell>No</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Code>/api/stats</Code>
                    </TableCell>
                    <TableCell>Fetch blockchain statistics</TableCell>
                    <TableCell>No</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Code>/api/block-headers</Code>
                    </TableCell>
                    <TableCell>Fetch block headers</TableCell>
                    <TableCell>No</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Code>/api/txos</Code>
                    </TableCell>
                    <TableCell>Fetch transaction outputs</TableCell>
                    <TableCell>No</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Code>/api/admin/import</Code>
                    </TableCell>
                    <TableCell>Control blockchain import process</TableCell>
                    <TableCell>Yes</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>Some endpoints require authentication with an API key.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                To authenticate, include the API key in the request headers:
              </p>
              <Code className="block p-4 mb-4">
                {`
{
  "x-api-key": "your-api-key"
}
                `}
              </Code>
              <p className="text-sm text-muted-foreground">
                The API key can be obtained from the system administrator.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="glyphs" className="space-y-4">
          <EndpointCard
            method="GET"
            endpoint="/api/glyphs"
            description="Fetch and search glyphs"
            queryParams={[
              { name: "query", type: "string", description: "Search query for name, description, or creator" },
              { name: "tokenType", type: "string", description: "Filter by token type (NFT, FT, DAT, etc.)" },
              { name: "limit", type: "number", description: "Number of results to return (default: 50)" },
              { name: "skip", type: "number", description: "Number of results to skip (default: 0)" },
              { name: "isContainer", type: "boolean", description: "Filter for containers only" },
              { name: "includeContainerItems", type: "boolean", description: "Include items in containers" },
              { name: "users", type: "boolean", description: "Filter for users only" },
              { name: "author", type: "string", description: "Filter by author/creator" },
              { name: "ref", type: "string", description: "Filter by reference ID" },
              { name: "container", type: "string", description: "Filter by container reference" },
            ]}
            responseExample={`
{
  "glyphs": [
    {
      "id": "6070c1e3b2a1c00015f8b0a1",
      "name": "Example Glyph",
      "description": "This is an example glyph",
      "imageUrl": "/placeholder.svg?height=400&width=400",
      "creator": "CraigD",
      "createdAt": "2023-04-10T12:00:00.000Z",
      "transactionHash": "0479476e862d14be43047c6e305fc3222e307420691d9a690096357fa86fe2c9",
      "blockNumber": 315117,
      "tokenType": "NFT",
      "ref": "d55361692eb71b9a3fe731231d09bab5693f89a7fa809c97f31b48335a019e58",
      "isContainer": false
    },
    // More glyphs...
  ]
}
            `}
          />

          <EndpointCard
            method="GET"
            endpoint="/api/glyphs/[id]"
            description="Fetch a specific glyph by ID"
            pathParams={[{ name: "id", type: "string", description: "The ID of the glyph" }]}
            queryParams={[
              {
                name: "includeContainerItems",
                type: "boolean",
                description: "Include items in container (if glyph is a container)",
              },
            ]}
            responseExample={`
{
  "glyph": {
    "id": "6070c1e3b2a1c00015f8b0a1",
    "name": "Example Glyph",
    "description": "This is an example glyph",
    "imageUrl": "/placeholder.svg?height=400&width=400",
    "creator": "CraigD",
    "createdAt": "2023-04-10T12:00:00.000Z",
    "transactionHash": "0479476e862d14be43047c6e305fc3222e307420691d9a690096357fa86fe2c9",
    "blockNumber": 315117,
    "tokenType": "NFT",
    "attributes": [
      {
        "trait_type": "pool",
        "value": "blockminerz.com"
      }
    ],
    "ref": "d55361692eb71b9a3fe731231d09bab5693f89a7fa809c97f31b48335a019e58",
    "isContainer": false,
    "containerItems": []
  }
}
            `}
          />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <EndpointCard
            method="GET"
            endpoint="/api/stats"
            description="Fetch blockchain statistics"
            responseExample={`
{
  "glyphs": {
    "total": 1250,
    "nft": 850,
    "ft": 300,
    "dat": 50,
    "containers": 30,
    "containedItems": 120,
    "users": 50
  },
  "txos": {
    "total": 5000,
    "rxd": 3000,
    "nft": 1500,
    "ft": 500
  },
  "blocks": {
    "count": 315200,
    "latest": {
      "hash": "000000000000000000000000000000000000000000000000000000000000abcd",
      "height": 315199,
      "timestamp": "2023-04-10T12:00:00.000Z"
    }
  }
}
            `}
          />
        </TabsContent>

        <TabsContent value="blocks" className="space-y-4">
          <EndpointCard
            method="GET"
            endpoint="/api/block-headers"
            description="Fetch block headers"
            queryParams={[
              { name: "height", type: "number", description: "Filter by block height" },
              { name: "hash", type: "string", description: "Filter by block hash" },
              { name: "latest", type: "boolean", description: "Get the latest block" },
              { name: "limit", type: "number", description: "Number of results to return (default: 50)" },
              { name: "skip", type: "number", description: "Number of results to skip (default: 0)" },
            ]}
            responseExample={`
{
  "blockHeaders": [
    {
      "_id": "6070c1e3b2a1c00015f8b0a1",
      "hash": "000000000000000000000000000000000000000000000000000000000000abcd",
      "height": 315199,
      "timestamp": "2023-04-10T12:00:00.000Z",
      "reorg": false
    },
    // More block headers...
  ]
}
            `}
          />
        </TabsContent>

        <TabsContent value="txos" className="space-y-4">
          <EndpointCard
            method="GET"
            endpoint="/api/txos"
            description="Fetch transaction outputs"
            queryParams={[
              { name: "contractType", type: "string", description: "Filter by contract type" },
              { name: "unspent", type: "boolean", description: "Filter for unspent outputs only" },
              { name: "limit", type: "number", description: "Number of results to return (default: 50)" },
              { name: "skip", type: "number", description: "Number of results to skip (default: 0)" },
            ]}
            responseExample={`
{
  "txos": [
    {
      "_id": "6070c1e3b2a1c00015f8b0a1",
      "txid": "0479476e862d14be43047c6e305fc3222e307420691d9a690096357fa86fe2c9",
      "vout": 0,
      "script": "76a914...",
      "value": 100000000,
      "date": 1617984000,
      "height": 315117,
      "spent": 0,
      "contractType": "NFT"
    },
    // More TXOs...
  ]
}
            `}
          />
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          <EndpointCard
            method="GET"
            endpoint="/api/admin/import"
            description="Get import state"
            authentication={true}
            responseExample={`
{
  "lastBlockHeight": 315199,
  "lastBlockHash": "000000000000000000000000000000000000000000000000000000000000abcd",
  "lastUpdated": "2023-04-10T12:00:00.000Z",
  "isImporting": false
}
            `}
          />

          <EndpointCard
            method="POST"
            endpoint="/api/admin/import"
            description="Start or control import process"
            authentication={true}
            requestBodyExample={`
{
  "resetToBlock": 315000,  // Optional: Reset import to this block height
  "resetImportFlag": false // Optional: Reset the import flag without starting import
}
            `}
            responseExample={`
{
  "message": "Import started",
  "lastBlockHeight": 315000
}
            `}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface EndpointCardProps {
  method: "GET" | "POST" | "PUT" | "DELETE"
  endpoint: string
  description: string
  authentication?: boolean
  pathParams?: Array<{ name: string; type: string; description: string }>
  queryParams?: Array<{ name: string; type: string; description: string }>
  requestBodyExample?: string
  responseExample: string
}

function EndpointCard({
  method,
  endpoint,
  description,
  authentication = false,
  pathParams = [],
  queryParams = [],
  requestBodyExample,
  responseExample,
}: EndpointCardProps) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const fullUrl = `${baseUrl}${endpoint}`

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                method === "GET"
                  ? "default"
                  : method === "POST"
                    ? "secondary"
                    : method === "PUT"
                      ? "outline"
                      : "destructive"
              }
            >
              {method}
            </Badge>
            <CardTitle className="text-lg">
              <Code>{endpoint}</Code>
            </CardTitle>
          </div>
          <CopyButton value={fullUrl} />
        </div>
        <CardDescription>{description}</CardDescription>
        {authentication && (
          <Badge variant="outline" className="mt-2">
            Requires Authentication
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {pathParams.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Path Parameters</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pathParams.map((param) => (
                  <TableRow key={param.name}>
                    <TableCell>
                      <Code>{param.name}</Code>
                    </TableCell>
                    <TableCell>{param.type}</TableCell>
                    <TableCell>{param.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {queryParams.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Query Parameters</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queryParams.map((param) => (
                  <TableRow key={param.name}>
                    <TableCell>
                      <Code>{param.name}</Code>
                    </TableCell>
                    <TableCell>{param.type}</TableCell>
                    <TableCell>{param.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {requestBodyExample && (
          <div>
            <h4 className="text-sm font-medium mb-2">Request Body Example</h4>
            <div className="relative">
              <Code className="block p-4 overflow-x-auto">{requestBodyExample}</Code>
              <CopyButton value={requestBodyExample} className="absolute top-2 right-2" />
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium mb-2">Response Example</h4>
          <div className="relative">
            <Code className="block p-4 overflow-x-auto">{responseExample}</Code>
            <CopyButton value={responseExample} className="absolute top-2 right-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
