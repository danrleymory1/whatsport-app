// src/app/notifications/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { PlayerNotifications } from "@/components/player/notifications";
import { useAuth } from "@/context/auth-context";
import { UserType } from "@/types/user";
import { redirect } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function NotificationsPage() {
  const { isAuthenticated, loading, userType } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!loading && !isAuthenticated) {
      redirect("/auth/sign-in");
    }
  }, [isAuthenticated, loading]);

  // Prevent server-side rendering issues
  if (!isClient) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userType={userType || UserType.PLAYER} />
      <main className="flex-1 overflow-y-auto">
        <PlayerNotifications />
      </main>
    </div>
  );
}