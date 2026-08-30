import { describe, expect, it } from "vitest";
import { analyzeWorkoutHistory } from "@/lib/workout/workout";
import { generateWorkoutPlan } from "@/lib/planning/workout-plan";

function createSession(
  date: string,
  exerciseName: string,
  weight: number,
  reps: number
) {
  return {
    id: `session-${date}-${exerciseName}`,
    user_id: "user-1",
    date,
    started_at: `${date}T10:00:00Z`,
    completed_at: `${date}T11:00:00Z`,
    notes: null,
    created_at: `${date}T11:00:00Z`,
    workout_sets: [
      {
        id: `set-${date}-${exerciseName}`,
        session_id: `session-${date}-${exerciseName}`,
        exercise_name: exerciseName,
        exercise_order: 1,
        set_number: 1,
        weight,
        reps,
        felt: "moderate" as const,
        created_at: `${date}T10:15:00Z`,
      },
    ],
  };
}

describe("workout plan evaluation contract", () => {
  it("preserves the deterministic recommendation exactly in the generated plan", () => {
    const analysis = analyzeWorkoutHistory([
      createSession("2026-08-17", "Bench Press", 77.5, 8),
      createSession("2026-08-20", "Bench Press", 80, 8),
      createSession("2026-08-17", "Squat", 100, 5),
      createSession("2026-08-20", "Squat", 95, 5),
    ]);

    expect(analysis).not.toBeNull();

    const plan = generateWorkoutPlan(analysis!);

    expect(plan.exercises).toHaveLength(2);
    expect(plan.exercises).toEqual([
      {
        exerciseName: "Bench Press",
        sets: 2,
        reps: 8,
        weight: 82.5,
        decision: "progress",
        reasonCode: "progressed",
        daysSinceLastTrained: 10,
      },
      {
        exerciseName: "Squat",
        sets: 2,
        reps: 8,
        weight: 97.5,
        decision: "progress",
        reasonCode: "progressed",
        daysSinceLastTrained: 10,
      },
    ]);
  });
});
