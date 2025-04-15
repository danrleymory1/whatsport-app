"use client";

import { useState, useEffect } from "react";
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
  User,
  DollarSign,
  Building,
  Check,
  Bell,
  PanelLeft
} from "lucide-react";
import { UserType } from "@/types/user";

interface SidebarProps {
  userType: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

export function Sidebar({ userType, collapsed: propCollapsed, onToggle }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(propCollapsed || false);
  const pathname = usePathname();
  const { logout, userEmail, user } = useAuth();
  const { theme, setTheme } = useTheme();

  // Update local state when prop changes
  useEffect(() => {
    if (propCollapsed !== undefined) {
      setCollapsed(propCollapsed);
    }
  }, [propCollapsed]);

  // Define items for all user types
  const sidebarItems: SidebarItem[] = [
    { name: "Início", href: "/", icon: Home },
    { name: "Meu Perfil", href: "/profile", icon: User },
    { name: "Eventos", href: "/events", icon: Calendar, roles: [UserType.PLAYER] },
    { name: "Espaços", href: "/spaces", icon: Building },
    { name: "Mapa", href: "/map", icon: Map, roles: [UserType.PLAYER] },
    { name: "Feed", href: "/feed", icon: MessageSquare, roles: [UserType.PLAYER] },
    { name: "Amigos", href: "/social", icon: Users, roles: [UserType.PLAYER] },
    { name: "Reservas", href: "/reservations", icon: Calendar },
    { name: "Solicitações", href: "/requests", icon: Bell, roles: [UserType.MANAGER] },
    { name: "Validar VCard", href: "/vcard", icon: Check, roles: [UserType.MANAGER] },
    { name: "Financeiro", href: "/finance", icon: DollarSign, roles: [UserType.MANAGER] },
    { name: "Configurações", href: "/settings", icon: Settings }
  ];

  // Filter items by user type
  const filteredItems = sidebarItems.filter(item => 
    !item.roles || item.roles.includes(userType)
  );

  const toggleSidebar = () => {
    const newValue = !collapsed;
    setCollapsed(newValue);
    if (onToggle) {
      onToggle();
    }
  };
  
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  
  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    }
    return userEmail ? userEmail.substring(0, 2).toUpperCase() : "U";
  };

  const basePath = userType === UserType.MANAGER ? '/manager' : '/player';

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
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto" aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
        <nav className="space-y-1 px-2">
          {filteredItems.map((item) => {
            const itemPath = basePath + item.href;
            const isActive = pathname === itemPath || pathname.startsWith(itemPath + '/');
            
            return (
              <Link
                key={item.href}
                href={itemPath}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user?.profile_image || ""} alt={userEmail || ""} />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="truncate">
              <p className="text-sm font-medium">{user?.name || userEmail}</p>
              <p className="text-xs text-muted-foreground capitalize">{userType}</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
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