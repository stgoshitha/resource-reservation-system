import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/auth/permissions";

import { Prisma } from "@/src/generated/prisma/client";
import { updateResourceSchema } from "@/src/lib/validations/resource";

interface RouteContext {
  params: Promise<{
    resourceId: string;
  }>;
}

// Retrieve a resource by its unique identifier
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    // Verify ADMIN authorization
    const auth = await requireAdmin();

    if (auth.error === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    if (auth.error === "FORBIDDEN") {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    // Validate the resource UUID
    const { resourceId } = await context.params;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(resourceId)) {
      return NextResponse.json(
        { message: "Invalid resource ID" },
        { status: 400 }
      );
    }

    // Retrieve the resource with its associated category
    const resource = await prisma.resource.findUnique({
      where: { resourceId },
      include: {
        category: {
          select: {
            categoryId: true,
            categoryCode: true,
            categoryName: true,
            description: true,
            bookingIntervalMinutes: true,
          },
        },
      },
    });

    if (!resource) {
      return NextResponse.json(
        { message: "Resource not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Resource retrieved successfully",
        resource,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get resource failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


// Update an existing resource and record the modifying administrator
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    // Verify authentication and ADMIN authorization
    const auth = await requireAdmin();

    if (auth.error === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    if (auth.error === "FORBIDDEN") {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    if (!auth.user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify the request origin to reduce CSRF risks
    const origin = request.headers.get("origin");

    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { message: "Invalid request origin" },
        { status: 403 }
      );
    }

    // Validate the resource UUID
    const { resourceId } = await context.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(resourceId)) {
      return NextResponse.json(
        { message: "Invalid resource ID" },
        { status: 400 }
      );
    }

    // Parse the request body and handle invalid JSON
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    // Validate the fields provided for the partial update
    const validation = updateResourceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid resource data",
          errors: validation.error.flatten().fieldErrors,
          formErrors: validation.error.flatten().formErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify that the new category exists when changing categories
    if (data.categoryId) {
      const category = await prisma.resourceCategory.findUnique({
        where: { categoryId: data.categoryId },
        select: { categoryId: true },
      });

      if (!category) {
        return NextResponse.json(
          { message: "Resource category not found" },
          { status: 404 }
        );
      }
    }

    // Update the resource without modifying its generated code
    const resource = await prisma.resource.update({
      where: { resourceId },
      data: {
        ...data,
        updatedBy: auth.user.userId,
      },
      include: {
        category: {
          select: {
            categoryId: true,
            categoryCode: true,
            categoryName: true,
            bookingIntervalMinutes: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Resource updated successfully",
        resource,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle missing records and database constraint violations
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Resource not found" },
          { status: 404 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          { message: "Invalid resource category reference" },
          { status: 400 }
        );
      }
    }

    console.error("Update resource failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


// Delete a resource while preserving reservation history
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    // Verify authentication and ADMIN authorization
    const auth = await requireAdmin();

    if (auth.error === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    if (auth.error === "FORBIDDEN") {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    // Verify the request origin to reduce CSRF risks
    const origin = request.headers.get("origin");

    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { message: "Invalid request origin" },
        { status: 403 }
      );
    }

    // Validate the resource UUID
    const { resourceId } = await context.params;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(resourceId)) {
      return NextResponse.json(
        { message: "Invalid resource ID" },
        { status: 400 }
      );
    }

    // Prevent deletion when the resource has reservation history
    const reservationCount = await prisma.reservation.count({
      where: { resourceId },
    });

    if (reservationCount > 0) {
      return NextResponse.json(
        {
          message:
            "Cannot delete resource because it has reservation history. Set the resource status to INACTIVE instead.",
        },
        { status: 409 }
      );
    }

    // Delete the resource when no reservations reference it
    await prisma.resource.delete({
      where: { resourceId },
    });

    return NextResponse.json(
      { message: "Resource deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    // Handle missing resources and foreign key constraint violations
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Resource not found" },
          { status: 404 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            message:
              "Cannot delete resource because it is referenced by existing records",
          },
          { status: 409 }
        );
      }
    }

    console.error("Delete resource failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

