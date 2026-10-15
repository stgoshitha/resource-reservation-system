import { z } from "zod";

const timeSchema = z.string().regex(
  /^([01]\d|2[0-3]):[0-5]\d$/,
  "Time must be in HH:mm format"
);

const operatingHoursModeSchema = z.enum([
  "STANDARD",
  "WEEKLY",
  "ALWAYS_OPEN",
]);

export const categoryScheduleSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isClosed: z.boolean(),
    openingTime: timeSchema,
    closingTime: timeSchema,
  })
  .refine(
    (schedule) =>
      schedule.isClosed || schedule.openingTime !== schedule.closingTime,
    {
      message: "Opening and closing times must be different on open days",
      path: ["closingTime"],
    }
  );

export const weeklyScheduleSchema = z
  .array(categoryScheduleSchema)
  .length(7, "All seven weekdays must be provided")
  .refine(
    (schedules) =>
      new Set(schedules.map((schedule) => schedule.dayOfWeek)).size === 7,
    { message: "Each weekday must appear exactly once" }
  );

const categoryFieldsSchema = z.object({
  categoryCode: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Only letters, numbers, underscores and hyphens are allowed"
    ),
  categoryName: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
  bookingIntervalMinutes: z.union([
    z.literal(15),
    z.literal(30),
    z.literal(60),
  ]),
  openingTime: timeSchema.default("08:00"),
  closingTime: timeSchema.default("18:00"),
  operatingHoursMode: operatingHoursModeSchema.default("STANDARD"),
});

export const createCategorySchema = categoryFieldsSchema
  .extend({ weeklySchedules: weeklyScheduleSchema.optional() })
  .superRefine((data, ctx) => {
    if (
      data.operatingHoursMode === "STANDARD" &&
      data.openingTime === data.closingTime
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["closingTime"],
        message: "Opening and closing times must be different",
      });
    }
    if (data.operatingHoursMode === "WEEKLY" && !data.weeklySchedules) {
      ctx.addIssue({
        code: "custom",
        path: ["weeklySchedules"],
        message: "Weekly schedules are required for WEEKLY mode",
      });
    }
  });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = categoryFieldsSchema
  .partial()
  .extend({ weeklySchedules: weeklyScheduleSchema.optional() })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "At least one field must be provided" }
  );

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryScheduleInput = z.infer<typeof categoryScheduleSchema>;
