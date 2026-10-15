import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/auth/permissions";

import { Prisma } from "@/src/generated/prisma/client";
import { updateCategorySchema } from "@/src/lib/validations/category";

interface RouteContext {
  params: Promise<{ categoryId: string }>;
}

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Retrieve a resource category by its unique identifier
export async function GET(request: Request, context: RouteContext) {
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

    if (!uuidRegex.test(categoryId)) {
      return NextResponse.json(
        { message: "Invalid category ID" },
        { status: 400 }
      );
    }

    const category = await prisma.resourceCategory.findUnique({
      where: { categoryId },
      include: {
        weeklySchedules: { orderBy: { dayOfWeek: "asc" } },
      },
    });

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Category retrieved successfully", category },
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
export async function PATCH(request: Request, context: RouteContext) {
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

    const { categoryId } = await context.params;

    if (!uuidRegex.test(categoryId)) {
      return NextResponse.json(
        { message: "Invalid category ID" },
        { status: 400 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON request body" },
        { status: 400 }
      );
    }

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

    const { weeklySchedules, ...categoryData } = validation.data;
    const userId = auth.user.userId;

    const result = await prisma.$transaction(async (tx) => {
      // Lock the category row to serialize schedule edits for this category.
      const rows = await tx.$queryRaw<{ category_id: string }[]>`
        SELECT "category_id"
        FROM "resource_categories"
        WHERE "category_id" = ${categoryId}::uuid
        FOR UPDATE
      `;

      if (rows.length === 0) {
        return { error: "NOT_FOUND" as const };
      }

      const existing = await tx.resourceCategory.findUniqueOrThrow({
        where: { categoryId },
        include: { weeklySchedules: true },
      });

      const nextMode =
        categoryData.operatingHoursMode ?? existing.operatingHoursMode;
      const nextOpeningTime =
        categoryData.openingTime ?? existing.openingTime;
      const nextClosingTime =
        categoryData.closingTime ?? existing.closingTime;

      if (
        nextMode === "STANDARD" &&
        nextOpeningTime === nextClosingTime
      ) {
        return { error: "INVALID_STANDARD_TIME" as const };
      }

      if (
        nextMode === "WEEKLY" &&
        !weeklySchedules &&
        existing.weeklySchedules.length !== 7
      ) {
        return { error: "WEEKLY_SCHEDULE_REQUIRED" as const };
      }

      // Preserve the original creator and creation timestamp of each day.
      if (weeklySchedules) {
        for (const schedule of weeklySchedules) {
          await tx.resourceCategorySchedule.upsert({
            where: {
              categoryId_dayOfWeek: {
                categoryId,
                dayOfWeek: schedule.dayOfWeek,
              },
            },
            create: {
              categoryId,
              ...schedule,
              createdBy: userId,
            },
            update: {
              isClosed: schedule.isClosed,
              openingTime: schedule.openingTime,
              closingTime: schedule.closingTime,
              updatedBy: userId,
            },
          });
        }
      }

      const category = await tx.resourceCategory.update({
        where: { categoryId },
        data: { ...categoryData, updatedBy: userId },
        include: {
          weeklySchedules: { orderBy: { dayOfWeek: "asc" } },
        },
      });

      return { category };
    });

    if ("error" in result) {
      if (result.error === "NOT_FOUND") {
        return NextResponse.json(
          { message: "Category not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          message:
            result.error === "INVALID_STANDARD_TIME"
              ? "Opening and closing times must be different for STANDARD mode"
              : "All seven weekly schedules are required for WEEKLY mode",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Category updated successfully", category: result.category },
      { status: 200 }
    );
  } catch (error) {
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
export async function DELETE(request: Request, context: RouteContext) {
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

    const { categoryId } = await context.params;

    if (!uuidRegex.test(categoryId)) {
      return NextResponse.json(
        { message: "Invalid category ID" },
        { status: 400 }
      );
    }

    // PostgreSQL prevents deletion when linked resources exist.
    // Weekly schedules are deleted via the category relation's cascade.
    await prisma.resourceCategory.delete({ where: { categoryId } });

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Category not found" },
          { status: 404 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          { message: "Cannot delete category because it has linked resources" },
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
