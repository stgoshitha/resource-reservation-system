
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/auth/permissions";

import { Prisma } from "@/src/generated/prisma/client";
import { updateCategorySchema } from "@/src/lib/validations/category";

interface RouteContext {
  params: Promise<{
    categoryId: string;
  }>;
}

// Retrieve a resource category by its unique identifier
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

    // Validate the category UUID
    const { categoryId } = await context.params;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(categoryId)) {
      return NextResponse.json(
        { message: "Invalid category ID" },
        { status: 400 }
      );
    }

    // Retrieve the category from the database
    const category = await prisma.resourceCategory.findUnique({
      where: { categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Category retrieved successfully",
        category,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get category failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update an existing resource category
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

    // Validate the category UUID
    const { categoryId } = await context.params;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(categoryId)) {
      return NextResponse.json(
        { message: "Invalid category ID" },
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
    const validation = updateCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid category data",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Update the category and record the modifying administrator
    const category = await prisma.resourceCategory.update({
      where: { categoryId },
      data: {
        ...validation.data,
        updatedBy: auth.user.userId,
      },
    });

    return NextResponse.json(
      {
        message: "Category updated successfully",
        category,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle missing categories and unique constraint violations
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Category not found" },
          { status: 404 }
        );
      }

      if (error.code === "P2002") {
        return NextResponse.json(
          { message: "Category code or name already exists" },
          { status: 409 }
        );
      }
    }

    console.error("Update category failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a resource category by its unique identifier
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

    // Validate the category UUID
    const { categoryId } = await context.params;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(categoryId)) {
      return NextResponse.json(
        { message: "Invalid category ID" },
        { status: 400 }
      );
    }

    // Delete the category while preserving database referential integrity
    // PostgreSQL prevents deletion when linked resources exist
    await prisma.resourceCategory.delete({
      where: { categoryId },
    });

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    // Handle missing categories and foreign key constraint violations
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Category not found" },
          { status: 404 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            message:
              "Cannot delete category because it has linked resources",
          },
          { status: 409 }
        );
      }
    }

    console.error("Delete category failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
