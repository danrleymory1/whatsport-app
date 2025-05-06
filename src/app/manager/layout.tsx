// src/app/manager/layout.tsx
"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { UserType } from "@/types/user";

export default function ManagerLayout({
                                          children,
                                      }: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar userType={UserType.MANAGER} />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}