import {
  getWorkoutAnalysis,
} from "@/lib/workout/workout-service";
import type { WorkoutHistoryInput } from "@/lib/workout/actions";
import {
  generateWorkoutPlan,
  type WorkoutPlan,
} from "@/lib/planning/workout-plan";

export async function getWorkoutPlan(
  input: WorkoutHistoryInput = {}
): Promise<WorkoutPlan | null> {
  const workoutAnalysis = await getWorkoutAnalysis(input);

  if (!workoutAnalysis) {
    return null;
  }

  return generateWorkoutPlan(workoutAnalysis);
}