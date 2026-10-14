"use client";

import { CalendarCheck2, Menu } from "lucide-react";
import type { HeaderProps } from "./Header.types";
import HeaderNavigation from "./header-components/HeaderNavigation";
import ProfileDropdown from "./header-components/ProfileDropdown";

export default function Header({
  title = "Dashboard",
  userName = "ReserveHub User",
  userEmail,
  role = "USER",
  onMenuClick,
  onLogout,
  loggingOut = false,
  actions,
  navigation,
  className = "",
}: HeaderProps) {
  const isAdmin = role === "ADMIN" ;

  return (
    <header
      className={[
        "sticky top-0 z-30 w-full shrink-0",
        "border-b border-slate-200/70",
        "bg-white/90 shadow-[0_4px_24px_-12px_rgba(15,23,42,0.12)]",
        "backdrop-blur-xl supports-[backdrop-filter]:bg-white/80",
        className,
      ].join(" ")}
    >
      <div
        className={[
          "relative mx-auto flex w-full items-center justify-between",
          "min-h-[64px] gap-3 px-4",
          "sm:min-h-[68px] sm:px-6",
          "lg:min-h-[76px] lg:px-8",
          "xl:px-10",
          "2xl:min-h-[80px] 2xl:px-12",
          "min-[1920px]:min-h-[84px] min-[1920px]:px-16",
          "min-[2560px]:max-w-[2400px]",
        ].join(" ")}
      >
        {/* Left: Menu + Branding */}
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              aria-label="Open navigation"
              onClick={onMenuClick}
              className={[
                "inline-flex h-10 w-10 shrink-0 items-center justify-center",
                "rounded-xl border border-slate-200 bg-white",
                "text-slate-600 shadow-sm transition-all duration-200",
                "hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600",
                "active:scale-95",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-indigo-500",
                "lg:hidden",
              ].join(" ")}
            >
              <Menu size={20} strokeWidth={2} />
            </button>
          )}

          {!isAdmin && (
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-500/20 sm:h-11 sm:w-11 sm:rounded-2xl">
                <CalendarCheck2 size={22} strokeWidth={2} />
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-[3px] border-white bg-emerald-400" />
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                  {title}
                </h1>
                <p className="hidden text-[11px] font-medium tracking-wide text-slate-400 sm:block">
                  RESOURCE MANAGEMENT
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Center: Navigation */}
        <div className="hidden min-w-0 flex-1 justify-center px-4 md:flex">
          <HeaderNavigation navigation={navigation} />
        </div>

        {/* Right: Actions + Profile */}
        <div className="flex min-w-0 shrink-0 items-center justify-end gap-2 sm:gap-3 lg:gap-4 2xl:gap-5">
          {actions && (
            <div className="hidden items-center gap-2 sm:flex xl:gap-3">
              {actions}
            </div>
          )}

          <div className="hidden h-8 w-px bg-slate-200 md:block 2xl:h-9" />

          <div className="min-w-0 rounded-2xl transition-colors duration-200 hover:bg-slate-50">
            <ProfileDropdown
              userName={userName}
              userEmail={userEmail}
              role={role}
              onLogout={onLogout}
              loggingOut={loggingOut}
            />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="border-t border-slate-100/80 bg-white/70 md:hidden">
        <div className="mx-auto w-full px-2 sm:px-4">
          <HeaderNavigation navigation={navigation} mobile />
        </div>
      </div>
    </header>
  );
}
