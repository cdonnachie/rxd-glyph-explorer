import { Header } from "@/components/header"
import { UserExplorer } from "@/components/user-explorer"
import { ScrollToTop } from "@/components/scroll-to-top"

export default function UsersPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-6 px-4 min-h-screen pt-2">
        <h1 className="text-3xl font-bold mb-6">Blockchain Users</h1>
        <UserExplorer />
      </main>
      <ScrollToTop />
    </>
  )
}
