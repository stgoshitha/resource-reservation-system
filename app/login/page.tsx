import { redirect } from "next/navigation";
import { getCurrentUser } from "@/src/lib/auth/session";
import LoginForm from "./LoginForm";

// Session checks must run on the server for every request.
export const instant = false;

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user?.userRole === "ADMIN") redirect("/admin");
  if (user?.userRole === "USER") redirect("/dashboard");

  return <LoginForm />;
}
