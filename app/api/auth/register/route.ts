import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { argon2id, hash } from "argon2";
import { prisma } from "@/src/lib/prisma";
import { registerSchema } from "@/src/lib/validations/auth";

export async function POST(request: Request) {
  try {
    //Parse the incoming JSON request body
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    //Validate user input before accessing the database
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid registration data",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { fullName, email, password } = validation.data;

    //Hash the password before storing it
    const passwordHash = await hash(password, {
      type: argon2id, // Argon2id
    });

    //Create a regular user account
    //Public registration must never assign ADMIN privileges
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        userRole: "USER",
      },
      select: {
        userId: true,
        fullName: true,
        email: true,
        userRole: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    //Handle duplicate email addresses using the database constraint
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Email is already registered" },
        { status: 409 }
      );
    }

    console.error("Registration failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
