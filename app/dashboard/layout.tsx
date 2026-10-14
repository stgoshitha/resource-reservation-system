import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/permissions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireUser();
  if (!auth.user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/dashboard" className="text-xl font-bold text-indigo-600">ReserveHub</Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
            <Link href="/dashboard" className="hover:text-indigo-600">Book a Resource</Link>
            <Link href="/dashboard/reservations" className="hover:text-indigo-600">My Reservations</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
