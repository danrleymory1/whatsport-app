// src/middleware.ts - Simplified to avoid redirect loops

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define public routes
  const publicPaths = [
    '/auth/sign-in', 
    '/auth/sign-up', 
    '/auth/forgot-password', 
    '/auth/reset-password'
  ];
  
  // Check for static assets and API routes
  const isPublicRoute = 
    publicPaths.includes(path) || 
    path.startsWith('/_next') || 
    path.startsWith('/api') || 
    path.startsWith('/images') || 
    path.includes('favicon.ico');

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for token
  const token = request.cookies.get('accessToken')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  // If no token and not a public route, redirect to login
  if (!token) {
    const loginUrl = new URL('/auth/sign-in', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If has token and trying to access auth pages, redirect to home
  if (path.startsWith('/auth/') && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Continue to protected route with token
  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};