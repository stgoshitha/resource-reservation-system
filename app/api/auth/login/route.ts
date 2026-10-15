import { NextResponse } from "next/server";
import { verify } from "argon2";
import { prisma } from "@/src/lib/prisma";
import { loginSchema } from "@/src/lib/validations/auth";
import { createSession } from "@/src/lib/auth/session";

export async function POST(request: Request) {
  try {
    //Reject cross-origin login requests
    const origin = request.headers.get("origin");

    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { message: "Invalid request origin" },
        { status: 403 }
      );
    }

    //Parse the request body
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    //Validate incoming credentials
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid login data" },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    //Find the user using the unique email address
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        userId: true,
        fullName: true,
        email: true,
        passwordHash: true,
        userRole: true,
        isActive: true,
      },
    });

    //Use a generic response to avoid exposing account existence
    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    //Verify the password against the stored Argon2id hash
    const isPasswordValid = await verify(
      user.passwordHash,
      password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    //Create a database-backed session and set its cookie
    await createSession(user.userId);

    //Never include the password hash in the response
    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          userRole: user.userRole,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
