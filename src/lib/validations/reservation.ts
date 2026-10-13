import { z } from "zod";

export const createReservationSchema = z
  .object({
    resourceId: z.uuid(),

    title: z
      .string()
      .trim()
      .min(2, "Reservation title must contain at least 2 characters")
      .max(150, "Reservation title is too long"),

    startTime: z.iso.datetime({ offset: true }),

    endTime: z.iso.datetime({ offset: true }),

    notes: z
      .string()
      .trim()
      .max(1000, "Notes cannot exceed 1000 characters")
      .optional(),
  })
  .refine(
    (data) =>
      new Date(data.endTime).getTime() >
      new Date(data.startTime).getTime(),
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  )
  .refine(
    (data) => new Date(data.startTime).getTime() > Date.now(),
    {
      message: "Reservation start time must be in the future",
      path: ["startTime"],
    }
  );

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
