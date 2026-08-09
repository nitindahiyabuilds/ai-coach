import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters"),

  age: z.coerce
    .number()
    .int()
    .min(13, "Age must be at least 13")
    .max(120, "Age must be realistic"),

  sex: z.enum(["male", "female"], {
    message: "Please select a valid sex",
  }),

  height_cm: z.coerce
    .number()
    .min(50, "Height must be at least 50 cm")
    .max(300, "Height must be realistic"),

  weight_kg: z.coerce
    .number()
    .min(20, "Weight must be at least 20 kg")
    .max(500, "Weight must be realistic"),

  activity_level: z.enum(["light", "moderate", "active"], {
    message: "Please select an activity level",
  }),

  goal: z.enum(["fat_loss", "maintenance", "muscle_gain"], {
    message: "Please select a goal",
  }),

  training_experience: z
    .string()
    .trim()
    .min(1, "Training experience is required"),

  equipment: z
    .string()
    .trim()
    .min(1, "Equipment information is required"),

  dietary_preference: z
    .string()
    .trim()
    .min(1, "Dietary preference is required"),

  region: z
    .string()
    .trim()
    .min(1, "Region is required"),
});