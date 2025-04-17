import { Header } from "@/components/header"
import { ApiDocumentation } from "@/components/api-documentation"

export default function ApiDocsPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-6 px-4 min-h-screen pt-2">
        <h1 className="text-3xl font-bold mb-6">API Documentation</h1>
        <ApiDocumentation />
      </main>
    </>
  )
}
