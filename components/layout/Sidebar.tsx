"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getSidebarItems } from "./sidebarItems";
import type { SidebarProps } from "./Sidebar.types";
import SidebarContent from "./SidebarContent";

export default function Sidebar({
  role,
  userName = "ReserveHub User",
  userEmail,
  collapsed = false,
  onCollapsedChange,
  mobileOpen = false,
  onMobileOpenChange,
  onLogout,
  loggingOut = false,
  className = "",
}: SidebarProps) {
  const pathname = usePathname();
  const [internalLoggingOut, setInternalLoggingOut] = useState(false);
  const [previousPathname, setPreviousPathname] = useState(pathname);

  const items = getSidebarItems(role);
  const busy = loggingOut || internalLoggingOut;

  // Close mobile sidebar when the route changes.
  useEffect(() => {
    if (pathname !== previousPathname) {
      setPreviousPathname(pathname);
      onMobileOpenChange?.(false);
    }
  }, [pathname, previousPathname, onMobileOpenChange]);

  // Close mobile sidebar using Escape.
  useEffect(() => {
    if (!mobileOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onMobileOpenChange?.(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen, onMobileOpenChange]);

  // Prevent background scrolling while the mobile sidebar is open.
  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  async function handleLogout() {
    if (!onLogout || busy) return;

    setInternalLoggingOut(true);

    try {
      await onLogout();
    } finally {
      setInternalLoggingOut(false);
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={[
          "hidden h-dvh shrink-0 flex-col",
          "border-r border-slate-200 bg-white",
          "transition-[width] duration-300 ease-in-out",
          "lg:flex",
          collapsed
            ? "w-[72px] xl:w-20 2xl:w-[88px] min-[1920px]:w-24"
            : "w-60 xl:w-64 2xl:w-72 min-[1920px]:w-80",
          className,
        ].join(" ")}
      >
        <SidebarContent
          role={role}
          userName={userName}
          userEmail={userEmail}
          collapsed={collapsed}
          isCollapsed={collapsed}
          isMobile={false}
          items={items}
          pathname={pathname}
          busy={busy}
          onLogout={onLogout}
          onMobileOpenChange={onMobileOpenChange}
          onCollapsedChange={onCollapsedChange}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Mobile & Tablet Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-300"
            onClick={() => onMobileOpenChange?.(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className={[
              "absolute inset-y-0 left-0",
              "w-[min(85vw,320px)]",
              "sm:w-[340px] md:w-[360px]",
              "bg-white shadow-2xl",
              "animate-[sidebar-slide-in_250ms_ease-out]",
              "motion-reduce:animate-none",
            ].join(" ")}
          >
            <SidebarContent
              role={role}
              userName={userName}
              userEmail={userEmail}
              collapsed={collapsed}
              isCollapsed={false}
              isMobile={true}
              items={items}
              pathname={pathname}
              busy={busy}
              onLogout={onLogout}
              onMobileOpenChange={onMobileOpenChange}
              onCollapsedChange={onCollapsedChange}
              handleLogout={handleLogout}
            />
          </aside>
        </div>
      )}
    </>
  );
}
