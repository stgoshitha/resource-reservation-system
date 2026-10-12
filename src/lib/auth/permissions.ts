import "server-only";

import { getCurrentUser } from "./session";

// Allow access only to authenticated users
export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      error: "UNAUTHORIZED" as const,
    };
  }

  return {
    user,
    error: null,
  };
}

// Restrict access to users with the ADMIN role
export async function requireAdmin() {
  const result = await requireUser();

  if (!result.user) {
    return {
      user: null,
      error: "UNAUTHORIZED" as const,
    };
  }

  if (result.user.userRole !== "ADMIN") {
    return {
      user: null,
      error: "FORBIDDEN" as const,
    };
  }

  return {
    user: result.user,
    error: null,
  };
}
