"use client";

import { ReactNode } from "react";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  showLogo?: boolean;
  showThemeToggle?: boolean;
  className?: string;
}

export function AuthLayout({
  children,
  title,
  description,
  showLogo = true,
  showThemeToggle = true,
  className,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b">
        <div className="container mx-auto flex justify-between items-center">
          {showLogo && (
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold">
                What<span className="text-primary">Sport</span>
              </h1>
            </Link>
          )}
          {showThemeToggle && <ThemeToggle />}
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {showLogo && (
            <div className="mx-auto w-auto flex justify-center">
              <h1 className="text-3xl font-bold text-center">
                What<span className="text-primary">Sport</span>
              </h1>
            </div>
          )}
          <h2 className="mt-6 text-center text-2xl font-bold">{title}</h2>
          {description && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div
            className={cn(
              "bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10",
              className
            )}
          >
            {children}
          </div>
        </div>
      </main>

      <footer className="py-4 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} WhatSport. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}