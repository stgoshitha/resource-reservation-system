import { z } from "zod";

// Validate and normalize user registration data
export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(150),

  email: z.email().trim().toLowerCase(),

  password: z.string()
  .min(8)
  .max(30)
  .regex(
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=]).+$/,
    "Password must contain at least one English letter, one number, and one special character.")

});

export type RegisterInput = z.infer<typeof registerSchema>;

// Validate login credentials without enforcing registration password rules
export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),

  password: z.string().min(1),
  
});

export type LoginInput = z.infer<typeof loginSchema>;
