
"use client";

import { useState } from "react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

import type { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void | Promise<void>;
}

export default function AdminLayout({
  children,
  userName = "Administrator",
  userEmail,
  onLogout,
}: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      <Sidebar
        role="ADMIN"
        userName={userName}
        userEmail={userEmail}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        onLogout={onLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title="Administration"
          role="ADMIN"
          userName={userName}
          userEmail={userEmail}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={onLogout}
        />

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
