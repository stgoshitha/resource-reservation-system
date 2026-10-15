import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/auth/permissions";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();

    if (auth.error === "UNAUTHORIZED") {
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

    const { searchParams } = new URL(request.url);

    const search = (searchParams.get("search") ?? "")
      .trim()
      .slice(0, 150);

    const status = searchParams.get("status") ?? "ALL";
    const page = Number(searchParams.get("page") ?? "1");
    const limit = 10;

    if (!Number.isSafeInteger(page) || page < 1 || page > 1000000) {
      return NextResponse.json(
        { message: "Invalid page number" },
        { status: 400 }
      );
    }

    if (!["ALL", "CONFIRMED", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid reservation status" },
        { status: 400 }
      );
    }

    const where: Prisma.ReservationWhereInput = {
      ...(status !== "ALL"
        ? {
            reservationStatus:
              status as "CONFIRMED" | "CANCELLED",
          }
        : {}),
      ...(search
        ? {
            OR: [
              {
                reservationTitle: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                user: {
                  is: {
                    fullName: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
              {
                user: {
                  is: {
                    email: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
              {
                resource: {
                  is: {
                    resourceName: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
              {
                resource: {
                  is: {
                    resourceCode: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [reservations, total] = await prisma.$transaction([
      prisma.reservation.findMany({
        where,
        select: {
          reservationId: true,
          reservationTitle: true,
          startTime: true,
          endTime: true,
          reservationStatus: true,
          notes: true,
          createdAt: true,
          user: {
            select: {
              userId: true,
              fullName: true,
              email: true,
            },
          },
          resource: {
            select: {
              resourceId: true,
              resourceCode: true,
              resourceName: true,
              location: true,
            },
          },
        },
        orderBy: [
          { startTime: "desc" },
          { reservationId: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.reservation.count({ where }),
    ]);

    return NextResponse.json(
      {
        message: "Reservations retrieved successfully",
        data: reservations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Get admin reservations failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
