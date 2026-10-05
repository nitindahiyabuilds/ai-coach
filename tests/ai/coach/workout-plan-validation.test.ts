import { describe, expect, it } from "vitest";
import { validateWorkoutPlanReasoning } from "@/lib/ai/coach/workout-plan-validation";
import type { WorkoutPlan } from "@/lib/contracts/workout";
import type { WorkoutPlanReasoning } from "@/lib/ai/coach/workout-plan";

function createPlan(): WorkoutPlan {
  return {
    exercises: [
      {
        exerciseName: "Bench Press",
        sets: 3,
        reps: 8,
        weight: 82.5,
        decision: "progress",
        reasonCode: "progressed",
        daysSinceLastTrained: 2,
      },
      {
        exerciseName: "Squat",
        sets: 3,
        reps: 6,
        weight: 100,
        decision: "hold",
        reasonCode: "maintain_after_decline",
        daysSinceLastTrained: 3,
      },
    ],
  };
}

function createReasoning(
  exerciseNames: string[],
): WorkoutPlanReasoning {
  return {
    exercises: exerciseNames.map((exerciseName) => ({
      exerciseName,
      reasoning: `Recommendation for ${exerciseName}.`,
    })),
  };
}

describe("validateWorkoutPlanReasoning", () => {
  it("accepts reasoning for every deterministic exercise exactly once", () => {
    const result = validateWorkoutPlanReasoning(
      createPlan(),
      createReasoning(["Bench Press", "Squat"]),
    );

    expect(result).toBe(true);
  });

  it("rejects reasoning when a deterministic exercise is missing", () => {
    const result = validateWorkoutPlanReasoning(
      createPlan(),
      createReasoning(["Bench Press"]),
    );

    expect(result).toBe(false);
  });

  it("rejects reasoning when an unknown exercise is returned", () => {
    const result = validateWorkoutPlanReasoning(
      createPlan(),
      createReasoning(["Bench Press", "Deadlift"]),
    );

    expect(result).toBe(false);
  });

  it("rejects duplicate reasoning entries", () => {
    const result = validateWorkoutPlanReasoning(
      createPlan(),
      createReasoning(["Bench Press", "Bench Press"]),
    );

    expect(result).toBe(false);
  });

  it("requires exact exercise name matching", () => {
    const result = validateWorkoutPlanReasoning(
      createPlan(),
      createReasoning(["bench press", "Squat"]),
    );

    expect(result).toBe(false);
  });

  it("accepts an empty plan with empty reasoning", () => {
    const result = validateWorkoutPlanReasoning(
      { exercises: [] },
      { exercises: [] },
    );

    expect(result).toBe(true);
  });
});