import { z } from "zod";

export const healthExplanationSchema = z.object({
  summary: z.string(),
  bmr: z.string(),
  tdee: z.string(),
  calories: z.string(),
  protein: z.string(),
  water: z.string(),
});

export type HealthExplanation = z.infer<
  typeof healthExplanationSchema
>;