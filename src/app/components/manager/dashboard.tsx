// src/components/manager/dashboard.tsx
"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { ManagerProfile } from "./profile";
import { RequestsManager } from "./requests-manager";
import { SpacesManager } from "./spaces-manager";
import { ScheduleManager } from "./schedule-manager";
import { FinanceManager } from "./finance-manager";
import { VCardValidator } from "./vcard-validator";
import { ManagerSettings } from "./settings";
import { usePathname } from "next/navigation";

interface ManagerDashboardProps {
  userEmail: string | null;
}

export function ManagerDashboard({ userEmail }: ManagerDashboardProps) {
  const pathname = usePathname();
  
  const renderContent = () => {
    const path = pathname || "/";
    
    switch (path) {
      case "/":
        return <ManagerOverview />;
      case "/requests":
        return <RequestsManager />;
      case "/spaces":
        return <SpacesManager />;
      case "/schedule":
        return <ScheduleManager />;
      case "/finance":
        return <FinanceManager />;
      case "/vcard":
        return <VCardValidator />;
      case "/profile":
        return <ManagerProfile userEmail={userEmail} />;
      case "/settings":
        return <ManagerSettings />;
      default:
        return <ManagerOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userType="gerente" />
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}

// Manager overview component - dashboard summary
function ManagerOverview() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard do Gerente</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard 
          title="Solicitações Pendentes" 
          value="5" 
          trend="+2" 
          description="Desde ontem" 
        />
        <DashboardCard 
          title="Eventos Hoje" 
          value="8" 
          trend="0" 
          description="Mesmo que ontem" 
        />
        <DashboardCard 
          title="Faturamento Mensal" 
          value="R$ 4.250" 
          trend="+15%" 
          description="Comparado ao mês anterior" 
          positive
        />
      </div>
    </div>
  );
}

// Dashboard card component
interface DashboardCardProps {
  title: string;
  value: string;
  trend: string;
  description: string;
  positive?: boolean;
}

function DashboardCard({ title, value, trend, description, positive }: DashboardCardProps) {
  return (
    <div className="bg-card p-6 rounded-lg border shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold">{value}</span>
        <span className={`text-sm ${positive ? 'text-green-500' : trend.includes('+') ? 'text-green-500' : trend === '0' ? 'text-muted-foreground' : 'text-red-500'}`}>
          {trend}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}