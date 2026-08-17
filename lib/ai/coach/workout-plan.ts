import { z } from "zod";

export const workoutPlanReasoningSchema = z.object({
  exercises: z.array(
    z.object({
      exerciseName: z.string().min(1),
      reasoning: z.string().min(1).max(500),
    })
  ),
});

export type WorkoutPlanReasoning = z.infer<
  typeof workoutPlanReasoningSchema
>;