import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Package, Users, FileText } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold">
            RXD Glyph Explorer
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/containers" className="text-sm font-medium hover:underline flex items-center">
            <Package className="h-4 w-4 mr-1" />
            Containers
          </Link>
          <Link href="/users" className="text-sm font-medium hover:underline flex items-center">
            <Users className="h-4 w-4 mr-1" />
            Users
          </Link>
          <Link href="/api-docs" className="text-sm font-medium hover:underline flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            API Docs
          </Link>
          <Link href="/admin" className="text-sm font-medium hover:underline">
            Admin
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
