export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/auth/permissions";
import { Prisma, UserRole } from "@/src/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }
    if (auth.error === "FORBIDDEN") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const params = new URL(request.url).searchParams;
    const search = (params.get("search") ?? "").trim().slice(0, 150);
    const role = params.get("role") ?? "ALL";
    const status = params.get("status") ?? "ALL";
    const pageValue = Number(params.get("page") ?? "1");
    const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? Math.min(pageValue, 1000000) : 1;
    const limit = 10;

    if (!["ALL", "ADMIN", "USER"].includes(role)) {
      return NextResponse.json({ message: "Invalid role filter" }, { status: 400 });
    }
    if (!["ALL", "ACTIVE", "INACTIVE"].includes(status)) {
      return NextResponse.json({ message: "Invalid status filter" }, { status: 400 });
    }

    const where: Prisma.UserWhereInput = {
      ...(search ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
      ...(role !== "ALL" ? { userRole: role as UserRole } : {}),
      ...(status !== "ALL" ? { isActive: status === "ACTIVE" } : {}),
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          userId: true,
          fullName: true,
          email: true,
          userRole: true,
          isActive: true,
          createdAt: true,
          _count: { select: { reservations: true } },
        },
        orderBy: [{ createdAt: "desc" }, { userId: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map(({ _count, ...user }) => ({
        ...user,
        reservationCount: _count.reservations,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Get admin users failed:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
