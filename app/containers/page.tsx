import { Header } from "@/components/header"
import { ContainerExplorer } from "@/components/container-explorer"
import { ScrollToTop } from "@/components/scroll-to-top"

export default function ContainersPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-6 px-4 min-h-screen pt-2">
        <h1 className="text-3xl font-bold mb-6">Glyph Containers</h1>
        <ContainerExplorer />
      </main>
      <ScrollToTop />
    </>
  )
}
