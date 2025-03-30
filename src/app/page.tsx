// src/app/page.tsx
"use client";

import { useAuth } from "./context/auth-context";
import { redirect } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";
import PlayerDashboard from "./components/player/dashboard";
import ManagerDashboard from "./components/manager/dashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Home() {
  const { isAuthenticated, userEmail, loading, userType } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      redirect("/auth/sign-in");
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (isAuthenticated && userEmail) {
      toast.success(`Bem-vindo ${userType === 'gerente' ? 'gerente' : 'jogador'}!`, {
        description: `Logado como ${userEmail}`,
      });
    }
  }, [isAuthenticated, userEmail, userType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will be redirected by the effect
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>}>
      {userType === 'gerente' ? (
        <ManagerDashboard />
      ) : (
        <PlayerDashboard />
      )}
    </Suspense>
  );
}