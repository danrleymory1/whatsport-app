// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Rotas públicas (não precisam de autenticação)
    const publicPaths = [
      '/auth/sign-in', 
      '/auth/sign-up', 
      '/auth/forgot-password', 
      '/auth/reset-password'
    ];
    
    // Verifica se é uma rota de recursos estáticos
    const isStaticAsset = path.startsWith('/_next') || 
                          path.startsWith('/api') || 
                          path.startsWith('/images') || 
                          path.includes('favicon.ico');

    // Se for uma rota pública ou de recurso estático, permite o acesso
    if (publicPaths.includes(path) || isStaticAsset) {
        return NextResponse.next();
    }

    // Obtém o token do cookie
    const token = request.cookies.get('accessToken')?.value;

    // Se não houver token, redireciona para o login
    if (!token) {
        const loginUrl = new URL('/auth/sign-in', request.url);
        
        // Se houver um redirecionamento forçado da página original, adicione ao URL
        if (!publicPaths.includes(path)) {
            loginUrl.searchParams.set('callbackUrl', path);
        }
        
        return NextResponse.redirect(loginUrl);
    }

    // Verifica se está tentando acessar uma página de autenticação enquanto já está logado
    if (path.startsWith('/auth/') && token) {
        return NextResponse.redirect(new URL('/', request.url));
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
       '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};