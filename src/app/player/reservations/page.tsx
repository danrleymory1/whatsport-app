"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { PlayerReservations } from "@/app/components/player/reservations";
import { useAuth } from "@/app/context/auth-context";
import { UserType } from "@/types/user";
import { redirect } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function ReservationsPage() {
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

  // Redirect managers to their own reservations page
  if (userType === UserType.MANAGER) {
    redirect("/manager/reservations");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userType={userType || UserType.PLAYER} />
      <main className="flex-1 overflow-y-auto">
        <PlayerReservations />
      </main>
    </div>
  );
}