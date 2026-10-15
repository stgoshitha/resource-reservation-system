"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import type { HeaderProps } from "../Header.types";

type ProfileDropdownProps = Pick<HeaderProps, "userName" | "userEmail" | "role" | "onLogout" | "loggingOut">;

export default function ProfileDropdown({
  userName = "ReserveHub User",
  userEmail,
  role = "USER",
  onLogout,
  loggingOut = false,
}: ProfileDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [internalLoggingOut, setInternalLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  const busy = loggingOut || internalLoggingOut;
  const displayName = userName.trim() || "User";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  const roleLabel = role === "ADMIN" ? "Administrator" : "Member";

  useEffect(() => {
    if (!profileOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }

    function handleOutsideClick(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [profileOpen]);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    if (busy) return;

    setInternalLoggingOut(true);
    setLogoutError("");

    try {
      if (onLogout) {
        await onLogout();
      } else {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Logout request failed");
      }

      setProfileOpen(false);
      router.replace("/login");
      router.refresh();
    } catch {
      setLogoutError("Unable to sign out. Please try again.");
    } finally {
      setInternalLoggingOut(false);
    }
  }

  return (
    <div ref={profileRef} className="relative">
      <button
        type="button"
        aria-label="Open profile menu"
        aria-haspopup="true"
        aria-expanded={profileOpen}
        onClick={() => setProfileOpen((previous) => !previous)}
        className={[
          "flex items-center gap-2.5 rounded-xl",
          "border border-transparent px-2 py-1.5",
          "transition-colors hover:border-slate-200",
          "hover:bg-slate-50",
          "focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-indigo-500",
        ].join(" ")}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
          {initials || "U"}
        </span>
        <div className="hidden max-w-40 text-left md:block">
          <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
          <p className="text-xs text-slate-500">{roleLabel}</p>
        </div>
        <ChevronDown
          size={16}
          className={[
            "hidden text-slate-400 transition-transform duration-200 md:block",
            profileOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {profileOpen && (
        <div
          className={[
            "absolute right-0 top-full z-50 mt-2",
            "w-[min(18rem,calc(100vw-2rem))]",
            "overflow-hidden rounded-2xl",
            "border border-slate-200 bg-white",
            "shadow-xl shadow-slate-900/10",
          ].join(" ")}
        >
          <div className="border-b border-slate-100 px-4 py-4">
            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
            {userEmail && <p className="mt-1 truncate text-xs text-slate-500">{userEmail}</p>}
            <span className="mt-3 inline-flex rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
              {roleLabel}
            </span>
          </div>
          <div className="p-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleLogout}
              className={[
                "flex w-full items-center gap-3",
                "rounded-xl px-3 py-2.5",
                "text-left text-sm font-medium",
                "text-red-600 transition-colors",
                "hover:bg-red-50",
                "focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-red-500",
                "disabled:cursor-not-allowed disabled:opacity-50",
              ].join(" ")}
            >
              <LogOut size={17} />
              {busy ? "Signing out..." : "Sign out"}
            </button>
            {logoutError && <p role="alert" className="px-3 py-2 text-xs text-red-600">{logoutError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
