import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth/permissions";

type RouteContext = {
  params: Promise<{ holdId: string }>;
};

// Release a temporary reservation hold owned by the authenticated user
export async function DELETE(request: Request, context: RouteContext) {
  try {
    // Ensure the request is made by an authenticated user
    const auth = await requireUser();
    if (auth.error === "UNAUTHORIZED" || !auth.user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }
    if (auth.error === "FORBIDDEN") {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    // Verify the request origin
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { message: "Invalid request origin" },
        { status: 403 }
      );
    }

    const { holdId } = await context.params;

    // Validate the hold identifier
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        holdId
      )
    ) {
      return NextResponse.json(
        { message: "Invalid reservation hold ID" },
        { status: 400 }
      );
    }

    // Delete only the hold belonging to the authenticated user
    const result = await prisma.reservationHold.deleteMany({
      where: {
        holdId,
        userId: auth.user.userId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { message: "Reservation hold not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Reservation hold released successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Release reservation hold failed:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
