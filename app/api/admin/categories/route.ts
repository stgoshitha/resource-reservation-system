import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";

import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/auth/permissions";
import { createCategorySchema } from "@/src/lib/validations/category";

export async function POST(request: Request) {
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
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Basic same-origin protection
    const origin = request.headers.get("origin");

    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { message: "Invalid request origin" },
        { status: 403 }
      );
    }

    // Parse JSON safely
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    // Validate the incoming category and weekly schedule data
    const validation = createCategorySchema.safeParse(body);

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

    // Create category and its weekly schedules atomically
    const category = await prisma.resourceCategory.create({
      data: {
        ...categoryData,
        createdBy: userId,
        ...(categoryData.operatingHoursMode === "WEEKLY" && weeklySchedules
          ? {
              weeklySchedules: {
                create: weeklySchedules.map((schedule) => ({
                  ...schedule,
                  createdBy: userId,
                })),
              },
            }
          : {}),
      },
      include: { weeklySchedules: { orderBy: { dayOfWeek: "asc" } } },
    });

    return NextResponse.json(
      { message: "Category created successfully", category },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Category code or name already exists" },
        { status: 409 }
      );
    }

    console.error("Create category failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
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

    // Read and validate query parameters
    const { searchParams } = new URL(request.url);

    const search = (searchParams.get("search") ?? "").trim();
    const pageValue = searchParams.get("page") ?? "1";
    const limitValue = searchParams.get("limit") ?? "10";

    const page = Number(pageValue);
    const limit = Number(limitValue);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return NextResponse.json(
        { message: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    if (search.length > 100) {
      return NextResponse.json(
        { message: "Search term is too long" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    if (!Number.isSafeInteger(skip)) {
      return NextResponse.json(
        { message: "Pagination range is too large" },
        { status: 400 }
      );
    }

    // Build a type-safe Prisma filter
    const where: Prisma.ResourceCategoryWhereInput = search
      ? {
          OR: [
            { categoryCode: { contains: search, mode: "insensitive" } },
            { categoryName: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    // Fetch matching categories and total count
    const [categories, total] = await prisma.$transaction([
      prisma.resourceCategory.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { categoryId: "desc" }],
        skip,
        take: limit,
        include: {
          weeklySchedules: { orderBy: { dayOfWeek: "asc" } },
        },
      }),
      prisma.resourceCategory.count({ where }),
    ]);

    return NextResponse.json(
      {
        message: "Categories retrieved successfully",
        data: categories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get categories failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
