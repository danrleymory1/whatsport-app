// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { UserType } from "@/types/user";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function HomePage() {
  const { isAuthenticated, userType, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/auth/sign-in");
      } else if (userType === UserType.PLAYER) {
        router.push("/player/dashboard");
      } else if (userType === UserType.MANAGER) {
        router.push("/manager/dashboard");
      }
    }
  }, [isAuthenticated, userType, loading, router]);

  return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
  );
}