import { NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth/permissions";
import { createReservationHoldSchema } from "@/src/lib/validations/reservation-hold";
import { isBookingTimeAligned } from "@/src/lib/config/booking-timezone";
import { isWithinOperatingHours } from "@/src/lib/utils/operating-hours";

const HOLD_DURATION_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  try {
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

    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { message: "Invalid request origin" },
        { status: 403 }
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

    const validation = createReservationHoldSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid reservation hold data",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { resourceId, startTime, endTime } = validation.data;
    const userId = auth.user.userId;
    const start = new Date(startTime);
    const end = new Date(endTime);

    const result = await prisma.$transaction(
      async (tx) => {
        // Serialize booking changes for this resource.
        await tx.$queryRaw`
          SELECT resource_id
          FROM resources
          WHERE resource_id = ${resourceId}::uuid
          FOR UPDATE
        `;

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
          return { status: 404, message: "Resource not found" };
        }

        if (resource.resourceStatus !== "AVAILABLE") {
          return {
            status: 409,
            message: "This resource is not available for booking.",
          };
        }

        if (start.getTime() <= Date.now()) {
          return {
            status: 400,
            message: "Reservation start time must be in the future",
          };
        }

        const interval = resource.category.bookingIntervalMinutes;
        const intervalMs = interval * 60_000;
        const durationMs = end.getTime() - start.getTime();

        if (
          interval <= 0 ||
          !isBookingTimeAligned(start, interval) ||
          !isBookingTimeAligned(end, interval) ||
          durationMs < intervalMs
        ) {
          return {
            status: 400,
            message: "Requested time does not match the resource booking interval",
          };
        }

        if (!isWithinOperatingHours(start, end, resource.category)) {
          return {
            status: 409,
            message: "Requested time is outside the resource operating hours",
          };
        }

        const now = new Date();
        const overlap = {
          startTime: { lt: end },
          endTime: { gt: start },
        };

        const reservation = await tx.reservation.findFirst({
          where: {
            resourceId,
            reservationStatus: "CONFIRMED",
            ...overlap,
          },
          select: { reservationId: true },
        });

        if (reservation) {
          return {
            status: 409,
            message: "This resource is already booked for the selected time.",
          };
        }

        const activeHold = await tx.reservationHold.findFirst({
          where: {
            resourceId,
            expiresAt: { gt: now },
            ...overlap,
          },
          select: {
            holdId: true,
            userId: true,
            startTime: true,
            endTime: true,
            expiresAt: true,
          },
        });

        if (activeHold) {
          const sameUser = activeHold.userId === userId;
          const sameTime =
            activeHold.startTime.getTime() === start.getTime() &&
            activeHold.endTime.getTime() === end.getTime();

          if (sameUser && sameTime) {
            return {
              status: 200,
              message: "Existing reservation hold retrieved",
              hold: activeHold,
            };
          }

          return {
            status: 409,
            message: "This time slot is temporarily held.",
          };
        }

        // Remove expired holds belonging to this user.
        await tx.reservationHold.deleteMany({
          where: {
            userId,
            expiresAt: { lte: now },
          },
        });

        const hold = await tx.reservationHold.create({
          data: {
            resourceId,
            userId,
            startTime: start,
            endTime: end,
            expiresAt: new Date(now.getTime() + HOLD_DURATION_MS),
          },
          select: {
            holdId: true,
            resourceId: true,
            startTime: true,
            endTime: true,
            expiresAt: true,
          },
        });

        return {
          status: 201,
          message: "Reservation hold created successfully",
          hold,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 5000,
        timeout: 10000,
      }
    );

    return NextResponse.json(result, { status: result.status });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json(
          { message: "Invalid resource or user reference" },
          { status: 400 }
        );
      }
      if (error.code === "P2034") {
        return NextResponse.json(
          { message: "Booking conflict detected. Please try again." },
          { status: 409 }
        );
      }
    }

    console.error("Create reservation hold failed:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
