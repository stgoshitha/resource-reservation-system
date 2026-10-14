import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminLayout } from "@/components/layout/admin";
import { requireUser } from "@/src/lib/auth/permissions";

export const instant = false;

export default async function AdminRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await requireUser();

  if (!auth.user) {
    redirect("/login");
  }

  if (auth.user.userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <AdminLayout
      userName={auth.user.fullName}
      userEmail={auth.user.email}
    >
      {children}
    </AdminLayout>
  );
}