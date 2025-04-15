// src/components/layout/sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationIndicator } from "@/components/notification-indicator";
import { useTheme } from "next-themes";
import { 
  ChevronRight, 
  ChevronLeft, 
  Home, 
  Calendar, 
  Users, 
  MessageSquare, 
  Map, 
  Settings, 
  LogOut,
  Sun,
  Moon,
  User
} from "lucide-react";

interface SidebarProps {
  userType: string;
}

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

export function Sidebar({ userType }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { logout, userEmail } = useAuth();
  const { theme, setTheme } = useTheme();

  // Define items based on user type
  const playerItems: SidebarItem[] = [
    { name: "Principal", href: "/", icon: Home },
    { name: "Eventos próximos", href: "/events", icon: Calendar },
    { name: "Mapa", href: "/map", icon: Map },
    { name: "Feed", href: "/feed", icon: MessageSquare },
    { name: "Amigos e Grupos", href: "/social", icon: Users },
    { name: "Perfil", href: "/profile", icon: User },
    { name: "Configurações", href: "/settings", icon: Settings },
  ];

  const managerItems: SidebarItem[] = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Solicitações", href: "/requests", icon: Calendar },
    { name: "Gerenciar Espaços", href: "/spaces", icon: Map },
    { name: "Agenda", href: "/schedule", icon: Calendar },
    { name: "Financeiro", href: "/finance", icon: MessageSquare },
    { name: "Validar VCard", href: "/vcard", icon: Users },
    { name: "Perfil", href: "/profile", icon: User },
    { name: "Configurações", href: "/settings", icon: Settings },
  ];

  const items = userType === 'gerente' ? managerItems : playerItems;

  const toggleSidebar = () => setCollapsed(!collapsed);
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  
  const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : "U";

  return (
    <div className={cn(
      "flex flex-col h-screen bg-background border-r transition-all duration-300 border-border",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <h2 className="text-xl font-bold">
            What<span className="text-primary">Sport</span>
          </h2>
        )}
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto">
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="space-y-1 px-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="" alt={userEmail || ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="truncate">
              <p className="text-sm font-medium">{userEmail}</p>
              <p className="text-xs text-muted-foreground capitalize">{userType}</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          <NotificationIndicator />

          
          <Button
            variant="destructive"
            size={collapsed ? "icon" : "sm"}
            onClick={logout}
            className={collapsed ? "w-full" : "w-full"}
          >
            <LogOut size={18} className={collapsed ? "" : "mr-2"} />
            {!collapsed && "Sair"}
          </Button>
        </div>
      </div>
    </div>
  );
}