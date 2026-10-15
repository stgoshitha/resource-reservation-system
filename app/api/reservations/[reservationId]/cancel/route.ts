import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/auth/permissions";

type RouteContext = {
  params: Promise<{
    reservationId: string;
  }>;
};

export async function PATCH(
  _request: Request,
  { params }: RouteContext
) {
  try {
    // Ensure the request is made by an authenticated user
    const auth = await requireUser();

    if (auth.error || !auth.user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const { reservationId } = await params;

    // Validate the reservation identifier before querying the database
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(reservationId)) {
      return NextResponse.json(
        { message: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // Retrieve only reservations owned by the authenticated user
    const reservation = await prisma.reservation.findFirst({
      where: {
        reservationId,
        userId: auth.user.userId,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { message: "Reservation not found" },
        { status: 404 }
      );
    }

    // Prevent duplicate cancellation requests
    if (reservation.reservationStatus === "CANCELLED") {
      return NextResponse.json(
        { message: "Reservation is already cancelled" },
        { status: 409 }
      );
    }

    // Allow cancellation only before the reservation starts
    if (reservation.startTime.getTime() <= Date.now()) {
      return NextResponse.json(
        { message: "Started or past reservations cannot be cancelled" },
        { status: 409 }
      );
    }

    // Conditionally update the status to prevent conflicting cancellations
    // Preserve the reservation record for history and auditing
    const result = await prisma.reservation.updateMany({
      where: {
        reservationId,
        userId: auth.user.userId,
        reservationStatus: "CONFIRMED",
        startTime: {
          gt: new Date(),
        },
      },
      data: {
        reservationStatus: "CANCELLED",
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { message: "Reservation can no longer be cancelled" },
        { status: 409 }
      );
    }

    const updatedReservation = await prisma.reservation.findUnique({
      where: { reservationId },
    });

    return NextResponse.json(
      {
        message: "Reservation cancelled successfully",
        reservation: updatedReservation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cancel reservation failed:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
