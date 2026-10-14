
import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth/permissions";
import { createReservationSchema } from "@/src/lib/validations/reservation";
import { isBookingTimeAligned } from "@/src/lib/config/booking-timezone";
import { isWithinOperatingHours } from "@/src/lib/utils/operating-hours";

// Create a reservation after validating resource availability
export async function POST(request: Request) {
  try {
    // Ensure the request is made by an authenticated user
    const auth = await requireUser();
    if (auth.error === "UNAUTHORIZED" || !auth.user) {
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

    // Verify the request origin
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { message: "Invalid request origin" },
        { status: 403 }
      );
    }

    // Parse the request body and validate the reservation details
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON request body" },
        { status: 400 }
      );
    }
    const validation = createReservationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid reservation data",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { resourceId, holdId, title, startTime, endTime, notes } =
      validation.data;
    const start = new Date(startTime);
    const end = new Date(endTime);

    // NEW: Lock the resource to prevent concurrent booking conflicts
    const result = await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`
          SELECT resource_id
          FROM resources
          WHERE resource_id = ${resourceId}::uuid
          FOR UPDATE
        `;

        // Retrieve the resource and its category-specific booking rules
        const resource = await tx.resource.findUnique({
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
                  select: {
                    dayOfWeek: true,
                    isClosed: true,
                    openingTime: true,
                    closingTime: true,
                  },
                },
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

        // Prevent reservations for resources that are not available for booking
        if (resource.resourceStatus === "MAINTENANCE") {
          return NextResponse.json(
            {
              message:
                "This resource is currently under maintenance and cannot be reserved.",
            },
            { status: 409 }
          );
        }
        if (resource.resourceStatus === "INACTIVE") {
          return NextResponse.json(
            {
              message:
                "This resource is currently inactive and cannot be reserved.",
            },
            { status: 409 }
          );
        }

        // Enforce the category's booking interval and minimum duration
        const interval = resource.category.bookingIntervalMinutes;
        const intervalMs = interval * 60_000;
        const durationMs = end.getTime() - start.getTime();
        if (
          interval <= 0 ||
          !isBookingTimeAligned(start, interval) ||
          !isBookingTimeAligned(end, interval) ||
          durationMs < intervalMs
        ) {
          return NextResponse.json(
            {
              message:
                "Requested time does not match the resource booking interval",
              bookingIntervalMinutes: resource.category.bookingIntervalMinutes,
            },
            { status: 400 }
          );
        }

        // Enforce category operating hours, including closed days and overnight windows
        if (!isWithinOperatingHours(start, end, resource.category)) {
          return NextResponse.json(
            { message: "Requested time is outside the resource operating hours" },
            { status: 409 }
          );
        }

        // NEW: Ensure the booking is still in the future
        if (start.getTime() <= Date.now()) {
          return NextResponse.json(
            { message: "Reservation start time must be in the future" },
            { status: 400 }
          );
        }

        // NEW: Validate hold ownership, expiration, resource, and selected time
        if (holdId) {
          const hold = await tx.reservationHold.findUnique({
            where: { holdId },
          });

          if (!hold || hold.userId !== auth.user.userId) {
            return NextResponse.json(
              { message: "Reservation hold not found" },
              { status: 404 }
            );
          }

          if (hold.expiresAt <= new Date()) {
            return NextResponse.json(
              { message: "Reservation hold has expired" },
              { status: 409 }
            );
          }

          if (
            hold.resourceId !== resourceId ||
            hold.startTime.getTime() !== start.getTime() ||
            hold.endTime.getTime() !== end.getTime()
          ) {
            return NextResponse.json(
              { message: "Reservation details do not match the hold" },
              { status: 400 }
            );
          }
        }

        // Define the overlapping time range using exclusive end boundaries
        const overlap = {
          startTime: { lt: end },
          endTime: { gt: start },
        };

        // Reject bookings that conflict with active temporary holds
        const activeHold = await tx.reservationHold.findFirst({
          where: {
            resourceId,
            expiresAt: { gt: new Date() },
            // NEW: Exclude the user's validated hold from conflict checking
            ...(holdId ? { holdId: { not: holdId } } : {}),
            ...overlap,
          },
          select: { holdId: true },
        });
        if (activeHold) {
          return NextResponse.json(
            { message: "This time slot is temporarily held by another booking." },
            { status: 409 }
          );
        }

        // Check confirmed reservations before attempting to create a new booking
        const existingReservation = await tx.reservation.findFirst({
          where: {
            resourceId,
            reservationStatus: "CONFIRMED",
            ...overlap,
          },
          select: { reservationId: true },
        });
        if (existingReservation) {
          return NextResponse.json(
            { message: "This resource is already booked for the selected time." },
            { status: 409 }
          );
        }

        // The PostgreSQL exclusion constraint provides final overlap protection
        const reservation = await tx.reservation.create({
          data: {
            resourceId,
            userId: auth.user.userId,
            reservationTitle: title,
            startTime: start,
            endTime: end,
            reservationStatus: "CONFIRMED",
            notes,
          },
          include: {
            resource: {
              select: {
                resourceId: true,
                resourceCode: true,
                resourceName: true,
              },
            },
          },
        });

        // NEW: Remove the temporary hold after successful reservation creation
        if (holdId) {
          await tx.reservationHold.delete({
            where: { holdId },
          });
        }

        return NextResponse.json(
          { message: "Reservation created successfully", reservation },
          { status: 201 }
        );
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 5000,
        timeout: 10000,
      }
    );

    return result;
  } catch (error) {
    // Translate known database errors into meaningful API responses
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (
        error.code === "P2004" ||
        error.code === "P2010" ||
        error.code === "P2034"
      ) {
        return NextResponse.json(
          { message: "This resource is already booked for the selected time." },
          { status: 409 }
        );
      }
      if (error.code === "P2003") {
        return NextResponse.json(
          { message: "Invalid resource or user reference" },
          { status: 400 }
        );
      }
    }
    console.error("Create reservation failed:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Retrieve reservations belonging to the authenticated user
export async function GET(request: Request) {
  try {
    // Restrict reservation access to authenticated users
    const auth = await requireUser();
    if (auth.error || !auth.user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Read and validate pagination parameters
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "10");
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

    // Enforce ownership by filtering with the authenticated user's ID
    const where = { userId: auth.user.userId };

    // Fetch paginated reservations and the total count in one transaction
    const [reservations, total] = await prisma.$transaction([
      prisma.reservation.findMany({
        where,
        include: {
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
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get reservations failed:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
