import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('pawactivity_access_token')?.value;
  const pathname = request.nextUrl.pathname;

  const isPrivate = pathname.startsWith('/dashboard') || pathname.startsWith('/pets') || pathname.startsWith('/devices');
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isPrivate && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/pets/:path*', '/devices/:path*', '/login', '/register'],
};
