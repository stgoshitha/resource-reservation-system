
import { z } from "zod";

// Validate resource category creation data
export const createCategorySchema = z.object({
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
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// Allow partial updates while requiring at least one field
export const updateCategorySchema = createCategorySchema
  .partial()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    {
      message: "At least one field must be provided",
    }
  );

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
