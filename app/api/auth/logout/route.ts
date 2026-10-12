import { NextResponse } from "next/server";
import { deleteSession } from "@/src/lib/auth/session";

export async function POST(request: Request) {
  try {
    //Basic same-origin protection for cookie-based logout
    const origin = request.headers.get("origin");

    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { message: "Invalid request origin" },
        { status: 403 }
      );
    }

    //Revoke the session and clear the browser cookie
    await deleteSession();

    return NextResponse.json(
      { message: "Logout successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}