
import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth/permissions";

export async function GET() {
  try {
    const result = await requireUser();

    if (!result.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const resources = await prisma.resource.findMany({
      where: {
        resourceStatus: "AVAILABLE",
      },
      select: {
        resourceId: true,
        resourceName: true,
        resourceCode: true,
        categoryId: true,
        location: true,
        capacity: true,
      },
      orderBy: {
        resourceName: "asc",
      },
    });

    const categoryIds = [
      ...new Set(resources.map((resource) => resource.categoryId)),
    ];

    const categories = await prisma.resourceCategory.findMany({
      where: {
        categoryId: {
          in: categoryIds,
        },
      },
      select: {
        categoryId: true,
        categoryName: true,
        bookingIntervalMinutes: true,
      },
    });

    const categoryMap = new Map(
      categories.map((category) => [
        category.categoryId,
        category,
      ])
    );

    const data = resources.flatMap((resource) => {
      const category = categoryMap.get(resource.categoryId);

      if (!category) return [];

      return [
        {
          ...resource,
          category,
        },
      ];
    });

    return NextResponse.json({ resources: data });
  } catch (error) {
    console.error("Failed to fetch resources:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
