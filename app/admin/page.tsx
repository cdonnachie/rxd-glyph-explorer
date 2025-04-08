import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { Header } from "@/components/header"

export default function AdminPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-6 px-4 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">RXD Blockchain Admin</h1>
        <AdminDashboard />
      </main>
    </>
  )
}

