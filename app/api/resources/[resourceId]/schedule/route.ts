import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth/permissions";
import { getOperatingWindowsForDate, localDayStart } from "@/src/lib/utils/operating-hours";

type Context = { params: Promise<{ resourceId: string }> };
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request, { params }: Context) {
  try {
    const auth = await requireUser();
    if (auth.error === "UNAUTHORIZED" || !auth.user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }
    if (auth.error === "FORBIDDEN") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }
    const { resourceId } = await params;
    const date = new URL(request.url).searchParams.get("date") ?? "";
    if (!uuidRegex.test(resourceId) || !dateRegex.test(date)) {
      return NextResponse.json({ message: "Invalid resource ID or date" }, { status: 400 });
    }
    const start = localDayStart(date);
    if (!start) {
      return NextResponse.json({ message: "Invalid date" }, { status: 400 });
    }
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const resource = await prisma.resource.findUnique({
      where: { resourceId },
      select: {
        resourceId: true,
        resourceStatus: true,
        category: {
          select: {
            bookingIntervalMinutes: true,
            operatingHoursMode: true,
            openingTime: true,
            closingTime: true,
            weeklySchedules: {
              select: { dayOfWeek: true, isClosed: true, openingTime: true, closingTime: true },
            },
          },
        },
      },
    });
    if (!resource) return NextResponse.json({ message: "Resource not found" }, { status: 404 });
    if (resource.resourceStatus !== "AVAILABLE") {
      return NextResponse.json({ message: "Resource is not available for booking" }, { status: 409 });
    }
    const overlap = { startTime: { lt: end }, endTime: { gt: start } };
    const [reservations, holds] = await prisma.$transaction([
      prisma.reservation.findMany({
        where: { resourceId, reservationStatus: "CONFIRMED", ...overlap },
        select: { startTime: true, endTime: true },
      }),
      prisma.reservationHold.findMany({
        where: { resourceId, expiresAt: { gt: new Date() }, ...overlap },
        select: { startTime: true, endTime: true },
      }),
    ]);
    return NextResponse.json({
      date,
      operatingHoursMode: resource.category.operatingHoursMode,
      bookingIntervalMinutes: resource.category.bookingIntervalMinutes,
      operatingWindows: getOperatingWindowsForDate(date, resource.category),
      busy: [
        ...reservations.map((item) => ({
          startTime: item.startTime.toISOString(),
          endTime: item.endTime.toISOString(),
          status: "RESERVED" as const,
        })),
        ...holds.map((item) => ({
          startTime: item.startTime.toISOString(),
          endTime: item.endTime.toISOString(),
          status: "HELD" as const,
        })),
      ],
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Get resource schedule failed:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
