// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Rotas públicas (não precisam de autenticação)
    const publicPaths = ['/auth/sign-in', '/auth/sign-up', '/auth/forgot-password', '/auth/reset-password'];

    // Verifica se o caminho atual é público
    if (publicPaths.includes(path)) {
        return NextResponse.next();
    }

    // Obtém o token do cookie (Mude para o nome do seu cookie!)
    const token = request.cookies.get('accessToken')?.value; //Mude o nome do cookie aqui


    // Se não houver token, redireciona para o login
    if (!token) {
        return NextResponse.redirect(new URL('/auth/sign-in', request.url));
    }

    // Se chegou aqui, o usuário está autenticado, continua
    return NextResponse.next();
}

// Configuração para quais rotas o middleware se aplica
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
};