import {
  getWorkoutAnalysis,
} from "@/lib/workout/workout-service";
import type { WorkoutHistoryInput } from "@/lib/workout/actions";
import type { WorkoutAnalysis } from "@/lib/workout/workout";
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

export function buildWorkoutIntelligence(
  workoutAnalysis: WorkoutAnalysis | null
): WorkoutIntelligenceResult {
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

export async function getWorkoutPlan(
  input: WorkoutHistoryInput = {}
): Promise<WorkoutIntelligenceResult> {
  const workoutAnalysis = await getWorkoutAnalysis(input);

  return buildWorkoutIntelligence(workoutAnalysis);
}