import { GlyphExplorer } from "@/components/glyph-explorer"
import { Dashboard } from "@/components/dashboard"
import { Header } from "@/components/header"
import { ScrollToTop } from "@/components/scroll-to-top"

export default function Home() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-6 px-4 min-h-screen">
      <div className="mb-8 pt-2">
          <Dashboard />
        </div>
        <GlyphExplorer />
      </main>
      <ScrollToTop />
    </>
  )
}

