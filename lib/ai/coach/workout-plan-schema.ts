import { z } from "zod";

export const workoutPlanReasoningSchema = z.object({
  exerciseName: z.string().min(1),
  reasoning: z.string().min(1).max(500),
});

export const workoutPlanResponseSchema = z.object({
  reasoning: z.array(workoutPlanReasoningSchema),
});

export type WorkoutPlanResponse = z.infer<
  typeof workoutPlanResponseSchema
>;