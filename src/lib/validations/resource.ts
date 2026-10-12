import { z } from "zod";

// Validate resource creation data.
export const createResourceSchema = z.object({
  categoryId: z.uuid(),

  resourceName: z.string().trim().min(2).max(150),

  description: z.string().trim().max(1000).optional(),

  location: z.string().trim().max(200).optional(),

  capacity: z.number().int().positive().optional(),

  resourceStatus: z
    .enum(["AVAILABLE", "MAINTENANCE", "INACTIVE"])
    .default("AVAILABLE"),
});

export type CreateResourceInput = z.infer<
  typeof createResourceSchema
>;

// Allow partial updates while requiring at least one field.
export const updateResourceSchema = createResourceSchema
  .partial()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    {
      message: "At least one field must be provided",
    }
  );

export type UpdateResourceInput = z.infer<
  typeof updateResourceSchema
>;
