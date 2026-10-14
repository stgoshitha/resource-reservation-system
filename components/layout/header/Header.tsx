
"use client";

import { useState } from "react";
import { ChevronDown, LogOut, Menu, UserRound } from "lucide-react";

import type { HeaderProps } from "./Header.types";

export default function Header({
  title = "Dashboard",
  userName = "ReserveHub User",
  userEmail,
  role = "USER",
  onMenuClick,
  onLogout,
  loggingOut = false,
  actions,
  className = "",
}: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [internalLoggingOut, setInternalLoggingOut] = useState(false);

  const busy = loggingOut || internalLoggingOut;

  async function handleLogout() {
    if (!onLogout || busy) return;

    setInternalLoggingOut(true);

    try {
      await onLogout();
      setProfileOpen(false);
    } finally {
      setInternalLoggingOut(false);
    }
  }

  return (
    <header
      className={[
        "sticky top-0 z-30 flex h-[72px] shrink-0",
        "items-center justify-between gap-4",
        "border-b border-slate-200 bg-white/95",
        "px-4 backdrop-blur-sm sm:px-6",
        className,
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 lg:hidden"
          >
            <Menu size={22} />
          </button>
        )}

        <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {actions && (
          <div className="hidden items-center gap-2 sm:flex">
            {actions}
          </div>
        )}

        <div className="relative">
          <button
            type="button"
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {userName.trim().charAt(0).toUpperCase() || "U"}
            </span>

            <div className="hidden text-left md:block">
              <p className="max-w-36 truncate text-sm font-semibold text-slate-900">
                {userName}
              </p>
              <p className="text-xs text-slate-500">
                {role === "ADMIN" ? "Administrator" : "User"}
              </p>
            </div>

            <ChevronDown
              size={16}
              className="hidden text-slate-400 md:block"
            />
          </button>

          {profileOpen && (
            <>
              <button
                type="button"
                aria-label="Close profile menu"
                onClick={() => setProfileOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />

              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-3">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {userName}
                  </p>

                  {userEmail && (
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {userEmail}
                    </p>
                  )}

                  <p className="mt-2 text-xs font-medium text-indigo-600">
                    {role === "ADMIN" ? "Administrator" : "User"}
                  </p>
                </div>

                <div className="py-1">
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500">
                    <UserRound size={17} />
                    My Account
                  </div>

                  {onLogout && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <LogOut size={17} />
                      {busy ? "Logging out..." : "Logout"}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
