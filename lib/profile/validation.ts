import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().min(2),
  age: z.coerce.number().min(13).max(120),
  sex: z.string(),
  height_cm: z.coerce.number().min(50).max(300),
  weight_kg: z.coerce.number().min(20).max(500),
  activity_level: z.enum(["light", "moderate", "active"]),
  goal: z.enum(["fat_loss", "maintenance", "muscle_gain"]),
  training_experience: z.string(),
  equipment: z.string(),
  dietary_preference: z.string(),
  region: z.string(),
});