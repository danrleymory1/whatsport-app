//src/components/layout/app-layout.tsx
"use client";

import { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { UserType } from "@/types/user";
import { useAuth } from "@/context/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  userType?: UserType;
  showSidebar?: boolean;
  className?: string;
}

export function AppLayout({
  children,
  userType: propUserType,
  showSidebar = true,
  className,
}: AppLayoutProps) {
  const pathname = usePathname();
  const { loading, userType: authUserType, isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Use the userType from auth context if not provided as prop
  const userType = propUserType || authUserType || UserType.PLAYER;
  
  // Determine if auth layout should be used
  const isAuthRoute = pathname?.startsWith('/auth/') || false;
  
  // Handle sidebar toggle
  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    // Store preference in localStorage
    localStorage.setItem('sidebarCollapsed', String(!sidebarCollapsed));
  };
  
  // Load sidebar state from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setSidebarCollapsed(savedState === 'true');
    }
  }, []);
  
  // Don't render anything during SSR
  if (!mounted) return null;
  
  // Show loading spinner while auth is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // For auth routes, just render children
  if (isAuthRoute) {
    return <>{children}</>;
  }
  
  // If not authenticated and not on auth route, children will handle redirect
  if (!isAuthenticated && !isAuthRoute) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {showSidebar && (
        <Sidebar 
          userType={userType} 
          collapsed={sidebarCollapsed}
          onToggle={handleToggleSidebar}
        />
      )}
      <main className={cn(
        "flex-1 overflow-y-auto",
        sidebarCollapsed ? "ml-16" : "ml-64",
        !showSidebar && "ml-0",
        className
      )}>
        {children}
      </main>
    </div>
  );
}