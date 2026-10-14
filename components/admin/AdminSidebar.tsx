
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navigation = [
  { label: "Overview", href: "/admin", icon: "▦" },
  { label: "Categories", href: "/admin/categories", icon: "▤" },
  { label: "Resources", href: "/admin/resources", icon: "▣" },
  { label: "Reservations", href: "/admin/reservations", icon: "▦" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-18 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3563E9] text-white">
          <span className="text-lg">▦</span>
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900">
          ReserveHub
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        {navigation.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin" &&
              pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-[#3563E9]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="w-5 text-center text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
        >
          <span className="w-5 text-center">↪</span>
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </aside>
  );
}
