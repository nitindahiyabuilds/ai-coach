import type { WorkoutAnalysis } from "@/lib/workout/workout";
import {
  generateWorkoutRecommendation,
  type ProgressionDecision,
} from "./progression";

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
};

export type WorkoutPlan = {
  exercises: WorkoutPlanExercise[];
};

export function generateWorkoutPlan(
  workoutAnalysis: WorkoutAnalysis
): WorkoutPlan {
  const exercises: WorkoutPlanExercise[] = [];

  for (const exercise of workoutAnalysis.exercises) {
    const recommendation =
      generateWorkoutRecommendation(exercise);

    exercises.push({
      exerciseName: recommendation.exercise_name,
      sets: recommendation.sets,
      reps: recommendation.reps,
      weight: recommendation.weight,
      decision: recommendation.decision,
      reasonCode: recommendation.reason_code,
      daysSinceLastTrained:
        recommendation.days_since_last_trained,
    });
  }

  return {
    exercises,
  };
}