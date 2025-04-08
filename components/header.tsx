import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold">
            RXD Glyph Explorer
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm font-medium hover:underline">
            Admin
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

