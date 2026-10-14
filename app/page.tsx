import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/permissions";

export const instant = false;

export default async function HomePage() {
  const auth = await requireUser();

  if (!auth.user) {
    redirect("/login");
  }

  if (auth.user.userRole === "ADMIN") {
    redirect("/admin");
  }

  redirect("/dashboard/reservations/new");
}
