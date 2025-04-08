import { GlyphExplorer } from "@/components/glyph-explorer"
import { Dashboard } from "@/components/dashboard"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-6 px-4 min-h-screen">
        <div className="mb-8">
          <Dashboard />
        </div>
        <GlyphExplorer />
      </main>
    </>
  )
}

