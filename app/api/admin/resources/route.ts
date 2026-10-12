
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/auth/permissions";
import { createResourceSchema } from "@/src/lib/validations/resource";
import { Prisma } from "@/src/generated/prisma/client";

// Create a resource with an automatically generated category-based code
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

    // Validate resource data before accessing the database
    const validation = createResourceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid resource data",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Retrieve the category code used as the resource code prefix
    const category = await prisma.resourceCategory.findUnique({
      where: {
        categoryId: data.categoryId,
      },
      select: {
        categoryCode: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { message: "Resource category not found" },
        { status: 404 }
      );
    }

    // Generate a unique resource code and retry on rare collisions
    for (let attempt = 0; attempt < 3; attempt++) {
      const randomSuffix = randomBytes(4)
        .toString("hex")
        .toUpperCase();

      const resourceCode = `${category.categoryCode}-${randomSuffix}`;

      try {
        const resource = await prisma.resource.create({
          data: {
            categoryId: data.categoryId,
            resourceCode,
            resourceName: data.resourceName,
            description: data.description,
            location: data.location,
            capacity: data.capacity,
            resourceStatus: data.resourceStatus,
            createdBy: auth.user.userId,
          },
        });

        return NextResponse.json(
          {
            message: "Resource created successfully",
            resource,
          },
          { status: 201 }
        );
      } catch (error) {
        // Retry only when the generated resource code conflicts
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          const target = error.meta?.target;

          const isResourceCodeConflict =
            typeof target === "string"
              ? target.includes("resource_code") ||
                target.includes("resourceCode")
              : Array.isArray(target) &&
                target.some(
                  (field) =>
                    field === "resource_code" ||
                    field === "resourceCode"
                );

          if (isResourceCodeConflict) {
            continue;
          }
        }

        throw error;
      }
    }

    return NextResponse.json(
      { message: "Unable to generate a unique resource code" },
      { status: 409 }
    );
  } catch (error) {
    // Handle database unique and foreign key constraint violations
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { message: "Resource already exists" },
          { status: 409 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          { message: "Invalid category or administrator reference" },
          { status: 400 }
        );
      }
    }

    console.error("Create resource failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


// Retrieve resources with search, filtering, and pagination
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId") || "";
    const status = searchParams.get("status") || "";

    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");

    // Validate pagination parameters
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return NextResponse.json(
        { message: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    // Validate optional resource filters
    if (categoryId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId)) {
      return NextResponse.json(
        { message: "Invalid category ID" },
        { status: 400 }
      );
    }

    const validStatuses = [
      "AVAILABLE",
      "MAINTENANCE",
      "INACTIVE",
    ] as const;

    if (
      status &&
      !validStatuses.some((value) => value === status)
    ) {
      return NextResponse.json(
        { message: "Invalid resource status" },
        { status: 400 }
      );
    }

    // Build database filters from the query parameters
    const where: Prisma.ResourceWhereInput = {
      ...(search && {
        OR: [
          {
            resourceCode: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            resourceName: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }),

      ...(categoryId && { categoryId }),

      ...(status && {
        resourceStatus: status as "AVAILABLE" | "MAINTENANCE" | "INACTIVE",
      }),
    };

    // Retrieve the requested page and total resource count
    const [resources, total] = await prisma.$transaction([
      prisma.resource.findMany({
        where,
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
        orderBy: [
          { createdAt: "desc" },
          { resourceId: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.resource.count({ where }),
    ]);

    return NextResponse.json(
      {
        message: "Resources retrieved successfully",
        data: resources,
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
    console.error("Get resources failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
