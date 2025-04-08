import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if the request is for the admin page
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // In a production app, you would implement proper authentication
    // For now, we'll just let the client-side handle authentication
    return NextResponse.next()
  }

  // For API routes that require authentication
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    const apiKey = request.headers.get("x-api-key")

    // Check if API key is valid
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}

