import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // إضافة cache headers للملفات الثابتة
  if (request.nextUrl.pathname.startsWith('/_next/static') || 
      request.nextUrl.pathname.startsWith('/fonts') ||
      request.nextUrl.pathname.includes('.')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    )
  }
  
  // منع الـ caching للصفحات الديناميكية
  if (request.nextUrl.pathname.startsWith('/api') || 
      !request.nextUrl.pathname.startsWith('/_next')) {
    response.headers.set(
      'Cache-Control',
      'no-store, must-revalidate'
    )
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
