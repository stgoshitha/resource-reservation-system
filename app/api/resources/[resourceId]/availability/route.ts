import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth/permissions";

interface RouteContext {
  params: Promise<{
    resourceId: string;
  }>;
}

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const offsetDateTimeRegex =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

// Check whether a resource can be reserved for a requested time range
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    // Restrict availability checks to authenticated users
    const auth = await requireUser();

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

    // Validate the resource identifier before accessing the database
    const { resourceId } = await context.params;

    if (!uuidRegex.test(resourceId)) {
      return NextResponse.json(
        { message: "Invalid resource ID" },
        { status: 400 }
      );
    }

    // Extract and validate timezone-aware reservation timestamps
    const { searchParams } = new URL(request.url);

    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    if (
      !startTime ||
      !endTime ||
      !offsetDateTimeRegex.test(startTime) ||
      !offsetDateTimeRegex.test(endTime)
    ) {
      return NextResponse.json(
        { message: "Valid startTime and endTime are required" },
        { status: 400 }
      );
    }

    // Ensure the requested time range is valid and starts in the future
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      start.getTime() <= Date.now() ||
      end.getTime() <= start.getTime()
    ) {
      return NextResponse.json(
        { message: "Invalid reservation time range" },
        { status: 400 }
      );
    }

    // Retrieve the resource status and category-specific booking interval
    const resource = await prisma.resource.findUnique({
      where: { resourceId },
      select: {
        resourceId: true,
        resourceCode: true,
        resourceName: true,
        resourceStatus: true,
        category: {
          select: {
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

    // Unavailable resources cannot accept new reservations
    if (resource.resourceStatus === "MAINTENANCE") {
      return NextResponse.json(
        {
          available: false,
          resourceStatus: "MAINTENANCE",
          reason:
            "This resource is currently under maintenance and cannot be reserved.",
        },
        { status: 200 }
      );
    }

    if (resource.resourceStatus === "INACTIVE") {
      return NextResponse.json(
        {
          available: false,
          resourceStatus: "INACTIVE",
          reason:
            "This resource is currently inactive and cannot be reserved.",
        },
        { status: 200 }
      );
    }

    // Validate slot boundaries using Sri Lanka's local booking time
    const intervalMs =
      resource.category.bookingIntervalMinutes * 60 * 1000;

    const sriLankaOffsetMs = 330 * 60 * 1000;

    const durationMs = end.getTime() - start.getTime();

    if (
      (start.getTime() + sriLankaOffsetMs) % intervalMs !== 0 ||
      (end.getTime() + sriLankaOffsetMs) % intervalMs !== 0 ||
      durationMs < intervalMs
    ) {
      return NextResponse.json(
        {
          available: false,
          reason:
            "Requested time does not match the booking interval",
          bookingIntervalMinutes:
            resource.category.bookingIntervalMinutes,
        },
        { status: 200 }
      );
    }

    // Detect overlapping bookings while allowing adjacent time slots
    const overlap = {
      startTime: { lt: end },
      endTime: { gt: start },
    };

    // Check confirmed reservations and unexpired temporary holds
    const [reservation, hold] = await prisma.$transaction([
      prisma.reservation.findFirst({
        where: {
          resourceId,
          reservationStatus: "CONFIRMED",
          ...overlap,
        },
        select: { reservationId: true },
      }),
      prisma.reservationHold.findFirst({
        where: {
          resourceId,
          expiresAt: { gt: new Date() },
          ...overlap,
        },
        select: { holdId: true },
      }),
    ]);

    // A conflicting reservation or hold makes the slot unavailable
    if (reservation || hold) {
      return NextResponse.json(
        {
          available: false,
          reason:
            "The requested time slot is already reserved or held",
        },
        { status: 200 }
      );
    }

    // Return the available time range in standardized UTC format
    return NextResponse.json(
      {
        available: true,
        resourceId: resource.resourceId,
        resourceCode: resource.resourceCode,
        resourceName: resource.resourceName,
        bookingIntervalMinutes:
          resource.category.bookingIntervalMinutes,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Check resource availability failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
