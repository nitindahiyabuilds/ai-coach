import { describe, expect, it } from "vitest";
import {
  analyzeWorkoutHistory,
  type WorkoutSession,
} from "@/lib/workout/workout";

function createSet(
  overrides: Partial<WorkoutSession["workout_sets"][number]> = {}
) {
  return {
    id: crypto.randomUUID(),
    session_id: "session-1",
    exercise_name: "Bench Press",
    exercise_order: 1,
    set_number: 1,
    weight: 80,
    reps: 8,
    felt: "moderate" as const,
    created_at: "2026-08-01T10:00:00Z",
    ...overrides,
  };
}

function createSession(
  date: string,
  sets: ReturnType<typeof createSet>[]
): WorkoutSession {
  return {
    id: `session-${date}`,
    user_id: "user-1",
    date,
    started_at: `${date}T10:00:00Z`,
    completed_at: `${date}T11:00:00Z`,
    notes: null,
    created_at: `${date}T11:00:00Z`,
    workout_sets: sets,
  };
}

describe("analyzeWorkoutHistory", () => {
  it("returns null when there is no workout history", () => {
    expect(analyzeWorkoutHistory([])).toBeNull();
  });

  it("identifies the latest and previous workout sessions", () => {
    const latest = createSession("2026-08-20", [
      createSet({ weight: 80, reps: 8 }),
    ]);

    const previous = createSession("2026-08-17", [
      createSet({ weight: 77.5, reps: 8 }),
    ]);

    const analysis = analyzeWorkoutHistory([
      previous,
      latest,
    ]);

    expect(analysis?.latest_session.id).toBe(latest.id);
    expect(analysis?.previous_session?.id).toBe(previous.id);
  });

  it("calculates the top set correctly", () => {
    const session = createSession("2026-08-20", [
      createSet({
        set_number: 1,
        weight: 70,
        reps: 10,
      }),
      createSet({
        set_number: 2,
        weight: 80,
        reps: 8,
      }),
      createSet({
        set_number: 3,
        weight: 75,
        reps: 12,
      }),
    ]);

    const analysis = analyzeWorkoutHistory([session]);

    const exercise = analysis?.exercises[0];

    expect(exercise?.latest.top_set?.weight).toBe(80);
    expect(exercise?.latest.top_set?.reps).toBe(8);
  });

  it("calculates total workout volume for an exercise", () => {
    const session = createSession("2026-08-20", [
      createSet({
        weight: 80,
        reps: 8,
      }),
      createSet({
        weight: 70,
        reps: 10,
      }),
    ]);

    const analysis = analyzeWorkoutHistory([session]);

    const exercise = analysis?.exercises[0];

    expect(exercise?.latest.total_volume).toBe(1340);
  });

  it("builds a maximum three-session trend", () => {
    const sessions = [
      createSession("2026-08-20", [
        createSet({ weight: 80, reps: 8 }),
      ]),
      createSession("2026-08-17", [
        createSet({ weight: 77.5, reps: 8 }),
      ]),
      createSession("2026-08-14", [
        createSet({ weight: 75, reps: 8 }),
      ]),
      createSession("2026-08-11", [
        createSet({ weight: 72.5, reps: 8 }),
      ]),
    ];

    const analysis = analyzeWorkoutHistory(sessions);

    const exercise = analysis?.exercises[0];

    expect(exercise?.trend).toHaveLength(3);
    expect(exercise?.trend[0].session_date).toBe("2026-08-20");
    expect(exercise?.trend[1].session_date).toBe("2026-08-17");
    expect(exercise?.trend[2].session_date).toBe("2026-08-14");
  });

  it("calculates changes between the latest and previous session", () => {
    const latest = createSession("2026-08-20", [
      createSet({
        weight: 80,
        reps: 8,
      }),
    ]);

    const previous = createSession("2026-08-17", [
      createSet({
        weight: 77.5,
        reps: 7,
      }),
    ]);

    const analysis = analyzeWorkoutHistory([
      latest,
      previous,
    ]);

    const exercise = analysis?.exercises[0];

    expect(exercise?.changes.top_weight).toBe(2.5);
    expect(exercise?.changes.top_reps).toBe(1);
    expect(exercise?.changes.total_volume).toBe(97.5);
  });

  it("keeps exercise history independent for different exercises", () => {
    const session = createSession("2026-08-20", [
      createSet({
        exercise_name: "Bench Press",
        weight: 80,
        reps: 8,
      }),
      createSet({
        exercise_name: "Squat",
        weight: 100,
        reps: 5,
      }),
    ]);

    const analysis = analyzeWorkoutHistory([session]);

    expect(analysis?.exercises).toHaveLength(2);

    const bench = analysis?.exercises.find(
      (exercise) => exercise.exercise_name === "Bench Press"
    );

    const squat = analysis?.exercises.find(
      (exercise) => exercise.exercise_name === "Squat"
    );

    expect(bench?.latest.top_set?.weight).toBe(80);
    expect(squat?.latest.top_set?.weight).toBe(100);
  });
});