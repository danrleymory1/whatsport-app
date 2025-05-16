// src/components/auth/protected-route.tsx
"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { UserType } from "@/types/user";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ProtectedRouteProps {
    children: ReactNode;
    allowedUserTypes: UserType[];
}

export function ProtectedRoute({ children, allowedUserTypes }: ProtectedRouteProps) {
    const { isAuthenticated, userType, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                // Não está autenticado, redireciona para login com URL de retorno
                setRedirecting(true);
                router.push(`/auth/sign-in?returnUrl=${encodeURIComponent(pathname)}`);
            } else if (!allowedUserTypes.includes(userType as UserType)) {
                // Autenticado, mas sem permissão para esta rota
                setRedirecting(true);
                // Redirecionar para dashboard apropriado
                if (userType === UserType.PLAYER) {
                    router.push("/player/dashboard");
                } else if (userType === UserType.MANAGER) {
                    router.push("/manager/dashboard");
                }
            } else {
                // Autenticado e autorizado
                setIsAuthorized(true);
            }
        }
    }, [isAuthenticated, loading, userType, allowedUserTypes, router, pathname]);

    // Mostrar indicador de carregamento enquanto verifica autenticação ou durante redirecionamento
    if (loading || redirecting) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Renderiza os filhos apenas se o usuário estiver autorizado
    if (!isAuthorized) {
        return null;
    }

    return <>{children}</>;
}