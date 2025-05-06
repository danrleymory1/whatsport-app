// src/components/auth/protected-route.tsx
"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
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
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                router.push("/auth/sign-in");
            } else if (!allowedUserTypes.includes(userType as UserType)) {
                // Redirecionar para dashboard apropriado
                if (userType === UserType.PLAYER) {
                    router.push("/player/dashboard");
                } else if (userType === UserType.MANAGER) {
                    router.push("/manager/dashboard");
                }
            } else {
                setIsAuthorized(true);
            }
        }
    }, [isAuthenticated, loading, userType, allowedUserTypes, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return <>{children}</>;
}