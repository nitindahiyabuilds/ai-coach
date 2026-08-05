import { z } from "zod";

export const signUpSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password is too long."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;