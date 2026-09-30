import type { WorkoutAnalysis } from "@/lib/workout/workout";
import {
  generateWorkoutRecommendation,
  type ProgressionDecision,
} from "./progression";
import type {
  WorkoutPlan,
  WorkoutPlanExercise,
} from "@/lib/contracts/workout";

export type { WorkoutPlan, WorkoutPlanExercise };

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