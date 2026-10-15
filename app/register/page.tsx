import { redirect } from "next/navigation";
import { getCurrentUser } from "@/src/lib/auth/session";
import RegisterForm from "./RegisterForm";

export const instant = false;

export default async function RegisterPage() {
  // Redirect signed-in users away from registration.
  const user = await getCurrentUser();

  if (user?.userRole === "ADMIN") redirect("/admin");
  if (user?.userRole === "USER") redirect("/dashboard");

  return <RegisterForm />;
}
