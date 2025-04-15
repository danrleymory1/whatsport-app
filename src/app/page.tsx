// src/app/page.tsx - Fixed home page to handle auth correctly

"use client";

import { useAuth } from "./context/auth-context";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import PlayerDashboard from "./components/player/dashboard";
import ManagerDashboard from "./components/manager/dashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Home() {
  const { isAuthenticated, userEmail, loading, userType } = useAuth();
  const [redirected, setRedirected] = useState(false);

  // Show welcome toast once when authenticated
  useEffect(() => {
    if (isAuthenticated && userEmail && !redirected) {
      toast.success(`Bem-vindo ${userType === 'gerente' ? 'gerente' : 'jogador'}!`, {
        description: `Logado como ${userEmail}`,
      });
      setRedirected(true);
    }
  }, [isAuthenticated, userEmail, userType, redirected]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // After loading, if authenticated, show the appropriate dashboard
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