import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header-components";
import { requireUser } from "@/src/lib/auth/permissions";

export const instant = false;

const userNavigation = [
  {
    label: "Book a Resource",
    href: "/dashboard/reservations/new",
  },
  {
    label: "My Reservations",
    href: "/dashboard/reservations",
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireUser();

  if (!auth.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="ReserveHub"
        userName={auth.user.fullName}
        userEmail={auth.user.email}
        role={auth.user.userRole}
        navigation={userNavigation}
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
