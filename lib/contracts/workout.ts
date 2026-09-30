import type { ProgressionDecision } from "@/lib/planning/progression";

export type WorkoutPlanExercise = {
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number;
  decision: ProgressionDecision;
  reasonCode:
    | "progressed"
    | "maintain_after_decline"
    | "deload_after_repeated_decline"
    | "recent_return"
    | "insufficient_history";
  daysSinceLastTrained: number;
  reasoning?: string;
};

export type WorkoutPlan = {
  exercises: WorkoutPlanExercise[];
};