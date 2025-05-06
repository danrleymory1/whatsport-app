// src/app/auth/layout.tsx
"use client";

import { AuthLayout } from "@/components/auth/auth-layout";

export default function LoginLayout({
                                        children,
                                    }: {
    children: React.ReactNode;
}) {
    return (
        <AuthLayout title="" showLogo={true}>
            {children}
        </AuthLayout>
    );
}