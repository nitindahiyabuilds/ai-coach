import type { WorkoutPlan } from "@/lib/contracts/workout";
import type { WorkoutPlanReasoning } from "./workout-plan";

export function validateWorkoutPlanReasoning(
  plan: WorkoutPlan,
  reasoning: WorkoutPlanReasoning,
): boolean {
  const expectedExerciseNames = plan.exercises.map(
    (exercise) => exercise.exerciseName,
  );

  const receivedExerciseNames = reasoning.exercises.map(
    (exercise) => exercise.exerciseName,
  );

  if (
    receivedExerciseNames.length !==
    expectedExerciseNames.length
  ) {
    return false;
  }

  const expectedExerciseNamesSet =
    new Set(expectedExerciseNames);

  const receivedExerciseNamesSet =
    new Set(receivedExerciseNames);

  if (
    receivedExerciseNamesSet.size !==
    receivedExerciseNames.length
  ) {
    return false;
  }

  if (
    receivedExerciseNamesSet.size !==
    expectedExerciseNamesSet.size
  ) {
    return false;
  }

  for (const exerciseName of receivedExerciseNames) {
    if (!expectedExerciseNamesSet.has(exerciseName)) {
      return false;
    }
  }

  return true;
}