import {
  getWorkoutAnalysis,
} from "@/lib/workout/workout-service";
import type { WorkoutHistoryInput } from "@/lib/workout/actions";
import {
  generateWorkoutPlan,
  type WorkoutPlan,
} from "@/lib/planning/workout-plan";

export type WorkoutIntelligenceResult =
  | {
      status: "ready";
      plan: WorkoutPlan;
    }
  | {
      status: "needs_baseline";
    };

export async function getWorkoutPlan(
  input: WorkoutHistoryInput = {}
): Promise<WorkoutIntelligenceResult> {
  const workoutAnalysis = await getWorkoutAnalysis(input);

  if (!workoutAnalysis) {
    return {
      status: "needs_baseline",
    };
  }

  return {
    status: "ready",
    plan: generateWorkoutPlan(workoutAnalysis),
  };
}