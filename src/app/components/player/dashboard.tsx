// src/components/player/dashboard.tsx
"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { UserProfile } from "./profile";
import { EventsNearby } from "./events-nearby";
import { SportsMap } from "./sports-map";
import { PlayerFeed } from "./feed";
import { FriendsGroups } from "./friends-groups";
import { UserSettings } from "./settings";
import { usePathname } from "next/navigation";

interface PlayerDashboardProps {
  userEmail: string | null;
}

export function PlayerDashboard({ userEmail }: PlayerDashboardProps) {
  const pathname = usePathname();
  
  const renderContent = () => {
    const path = pathname || "/";
    
    switch (path) {
      case "/":
        return <SportsMap />;
      case "/events":
        return <EventsNearby />;
      case "/map":
        return <SportsMap />;
      case "/feed":
        return <PlayerFeed />;
      case "/social":
        return <FriendsGroups />;
      case "/profile":
        return <UserProfile userEmail={userEmail} />;
      case "/settings":
        return <UserSettings />;
      default:
        return <SportsMap />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userType="jogador" />
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}