import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "../prisma";

const SESSION_COOKIE_NAME = "rrs_session";
const SESSION_DURATION_DAYS = 7;

// Hash session tokens before storing or querying them
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  // Generate a secure session token and store only its hash
  const token = randomBytes(32).toString("hex");
  const sessionTokenHash = hashSessionToken(token);

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  );

  await prisma.userSession.create({
    data: {
      userId,
      sessionTokenHash,
      expiresAt,
    },
  });

  // Keep the original token in a secure, HttpOnly cookie
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.userSession.findUnique({
    where: {
      sessionTokenHash: hashSessionToken(token),
    },
    include: {
      user: {
        select: {
          userId: true,
          fullName: true,
          email: true,
          userRole: true,
          isActive: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  // Reject expired sessions and inactive user accounts
  if (session.expiresAt <= new Date()) {
    return null;
  }

  if (!session.user.isActive) {
    return null;
  }

  return session.user;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // Revoke the database session before removing the browser cookie
  if (token) {
    await prisma.userSession.deleteMany({
      where: {
        sessionTokenHash: hashSessionToken(token),
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
