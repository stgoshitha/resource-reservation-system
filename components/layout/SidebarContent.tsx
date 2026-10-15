"use client";

import Link from "next/link";
import {ChevronLeft, ChevronRight, LogOut, X } from "lucide-react";
import type { SidebarItem, SidebarProps } from "./Sidebar.types";
import Image from "next/image";

type SidebarContentProps = Pick<SidebarProps, "role" | "userEmail" | "onMobileOpenChange" | "onCollapsedChange"> & {
  userName: string;
  collapsed: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  items: SidebarItem[];
  pathname: string;
  busy: boolean;
  onLogout?: SidebarProps["onLogout"];
  handleLogout: () => Promise<void>;
};

export default function SidebarContent({
  role, userName, userEmail, collapsed, isCollapsed, isMobile, items,
  pathname, busy, onLogout, onMobileOpenChange, onCollapsedChange, handleLogout,
}: SidebarContentProps) {
  function isActive(item: SidebarItem) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
    return (
      <div className="flex h-full min-h-0 flex-col">
        {/* Branding */}
        <div
          className={[
            "flex h-[80px] shrink-0 items-center",
            "border-b border-slate-200 px-5",
            isCollapsed
              ? "justify-center"
              : "justify-between",
          ].join(" ")}
        >
          <Link
            href={
              role === "ADMIN"
                ? "/admin"
                : "/dashboard"
            }
            className="flex min-w-0 items-center gap-2"
            aria-label="ReserveHub home"
            onClick={() => {
              if (isMobile) {
                onMobileOpenChange?.(false);
              }
            }}
          >
            <Image
                src="/ReserveHub-Logo.png"
                alt="ReserveHub Logo"
                width={50}
                height={50}
                className="h-[50px] w-[50px] object-cover"
                priority
              />
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-lg font-bold tracking-tight text-slate-900">
                  ReserveHub
                </p>
                <p className="text-xs text-slate-500">
                  Reservation System
                </p>
              </div>
            )}
          </Link>
          {isMobile && (
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() =>
                onMobileOpenChange?.(false)
              }
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          )}
        </div>
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          {!isCollapsed && (
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {role === "ADMIN"
                ? "Administration"
                : "Workspace"}
            </p>
          )}
          <nav
            aria-label={
              role === "ADMIN"
                ? "Admin navigation"
                : "User navigation"
            }
            className="space-y-1"
          >
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={
                    isCollapsed
                      ? item.label
                      : undefined
                  }
                  aria-label={
                    isCollapsed
                      ? item.label
                      : undefined
                  }
                  aria-current={
                    active ? "page" : undefined
                  }
                  onClick={() => {
                    if (isMobile) {
                      onMobileOpenChange?.(false);
                    }
                  }}
                  className={[
                    "flex items-center gap-3 rounded-xl",
                    "px-3 py-3 text-sm font-medium",
                    "transition-colors",
                    "focus-visible:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-indigo-500",
                    isCollapsed && "justify-center",
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <Icon
                    size={19}
                    className="shrink-0"
                    aria-hidden="true"
                  />
                  {!isCollapsed && (
                    <span className="truncate">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        {/* User profile and logout */}
        <div className="shrink-0 border-t border-slate-200 p-3">
          <div
            className={[
              "flex items-center gap-3 rounded-xl",
              "px-2 py-3",
              isCollapsed && "justify-center",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {userName.trim().charAt(0).toUpperCase() ||
                "U"}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {userName}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {userEmail ||
                    (role === "ADMIN"
                      ? "Administrator"
                      : "User")}
                </p>
              </div>
            )}
          </div>
          {onLogout && (
            <button
              type="button"
              disabled={busy}
              onClick={handleLogout}
              title={
                isCollapsed ? "Logout" : undefined
              }
              className={[
                "mt-1 flex w-full items-center gap-3",
                "rounded-xl px-3 py-3",
                "text-sm font-medium text-red-600",
                "transition-colors hover:bg-red-50",
                "disabled:cursor-not-allowed",
                "disabled:opacity-50",
                isCollapsed && "justify-center",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <LogOut
                size={19}
                aria-hidden="true"
              />
              {!isCollapsed && (
                <span>
                  {busy
                    ? "Logging out..."
                    : "Logout"}
                </span>
              )}
            </button>
          )}
          {/* Desktop collapse button */}
          {!isMobile && onCollapsedChange && (
            <button
              type="button"
              onClick={() =>
                onCollapsedChange(!collapsed)
              }
              aria-label={
                collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
              className="mt-2 hidden w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50 lg:flex"
            >
              {collapsed ? (
                <ChevronRight size={17} />
              ) : (
                <>
                  <ChevronLeft size={17} />
                  <span>Collapse</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
}
