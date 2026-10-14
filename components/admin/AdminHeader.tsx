
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { label: "Overview", href: "/admin" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Resources", href: "/admin/resources" },
  { label: "Reservations", href: "/admin/reservations" },
];

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const currentPage =
    links.find(
      (link) =>
        pathname === link.href ||
        (link.href !== "/admin" &&
          pathname.startsWith(link.href + "/")),
    )?.label ?? "Admin";

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/login");
      router.refresh();
    } catch {
      alert("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="flex h-18 items-center justify-between px-5 sm:px-8">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {currentPage}
          </h1>
          <p className="text-xs text-slate-500">Admin workspace</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-[#3563E9] sm:flex">
            A
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 lg:hidden"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="space-y-1 border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block rounded-lg px-4 py-3 text-sm ${
                pathname === link.href
                  ? "bg-blue-50 font-semibold text-[#3563E9]"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full rounded-lg px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </nav>
      )}
    </header>
  );
}
