import { z } from "zod";

export const createReservationHoldSchema = z
  .object({
    resourceId: z.uuid(),
    startTime: z.iso.datetime({ offset: true }),
    endTime: z.iso.datetime({ offset: true }),
  })
  .refine(
    (data) => new Date(data.endTime).getTime() > new Date(data.startTime).getTime(),
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

export type CreateReservationHoldInput = z.infer<typeof createReservationHoldSchema>;
