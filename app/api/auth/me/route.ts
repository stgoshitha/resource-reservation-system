import { NextResponse } from "next/server";
import { requireUser } from "@/src/lib/auth/permissions";

export async function GET() {
  // Verify the session before returning the authenticated user
  const result = await requireUser();

  if (!result.user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json(
    {
      user: result.user,
    },
    { status: 200 }
  );
}
