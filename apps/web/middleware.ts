import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getPublicOrigin(request: NextRequest) {
  const proto =
    request.headers.get('x-forwarded-proto') ??
    (request.nextUrl.protocol.replace(':', '') || 'https');

  const host =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    request.nextUrl.host;

  return `${proto}://${host}`;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('pawactivity_access_token')?.value;
  const pathname = request.nextUrl.pathname;

  const isPrivate =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/pets') ||
    pathname.startsWith('/devices') ||
    pathname.startsWith('/history');

  const isAuthPage = pathname === '/login' || pathname === '/register';

  const origin = getPublicOrigin(request);

  if (isPrivate && !token) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/pets/:path*', '/devices/:path*', '/history/:path*', '/login', '/register'],
};
