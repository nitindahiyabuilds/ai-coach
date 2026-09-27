import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWorkoutSessions: vi.fn(),
}));

vi.mock("@/lib/workout/actions", () => ({
  getWorkoutSessions: mocks.getWorkoutSessions,
}));

import { getWorkoutAnalysis } from "@/lib/workout/workout-service";

function createSet(
  overrides: Partial<{
    id: string;
    session_id: string;
    exercise_name: string;
    exercise_order: number;
    set_number: number;
    weight: number;
    reps: number;
    felt: "easy" | "moderate" | "hard" | null;
    created_at: string;
  }> = {}
) {
  return {
    id: "set-1",
    session_id: "session-1",
    exercise_name: "Bench Press",
    exercise_order: 1,
    set_number: 1,
    weight: 80,
    reps: 8,
    felt: "moderate" as const,
    created_at: "2026-08-20T10:00:00Z",
    ...overrides,
  };
}

function createSession(
  date: string,
  overrides: Partial<{
    id: string;
    completed_at: string | null;
    workout_sets: ReturnType<typeof createSet>[];
  }> = {}
) {
  return {
    id: overrides.id ?? `session-${date}`,
    user_id: "user-1",
    date,
    started_at: `${date}T10:00:00Z`,
    completed_at:
      overrides.completed_at !== undefined
        ? overrides.completed_at
        : `${date}T11:00:00Z`,
    notes: null,
    created_at: `${date}T11:00:00Z`,
    workout_sets: overrides.workout_sets ?? [createSet()],
  };
}

describe("getWorkoutAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the workout history query layer", async () => {
    const sessions = [createSession("2026-08-20")];

    mocks.getWorkoutSessions.mockResolvedValue(sessions);

    await getWorkoutAnalysis();

    expect(mocks.getWorkoutSessions).toHaveBeenCalledTimes(1);
    expect(mocks.getWorkoutSessions).toHaveBeenCalledWith({});
  });

  it("passes history filters to the workout history query", async () => {
    const sessions = [createSession("2026-08-20")];

    mocks.getWorkoutSessions.mockResolvedValue(sessions);

    const input = {
      from: "2026-08-01",
      to: "2026-08-31",
      limit: 10,
      offset: 0,
    };

    await getWorkoutAnalysis(input);

    expect(mocks.getWorkoutSessions).toHaveBeenCalledTimes(1);
    expect(mocks.getWorkoutSessions).toHaveBeenCalledWith(input);
  });

  it("returns null when there are no completed workouts", async () => {
    mocks.getWorkoutSessions.mockResolvedValue([
      createSession("2026-08-20", {
        completed_at: null,
      }),
    ]);

    const result = await getWorkoutAnalysis();

    expect(result).toBeNull();
  });

  it("analyzes completed workout history", async () => {
    const latest = createSession("2026-08-20", {
      workout_sets: [
        createSet({
          weight: 80,
          reps: 8,
        }),
      ],
    });

    const previous = createSession("2026-08-17", {
      workout_sets: [
        createSet({
          weight: 77.5,
          reps: 8,
        }),
      ],
    });

    mocks.getWorkoutSessions.mockResolvedValue([
      latest,
      previous,
    ]);

    const result = await getWorkoutAnalysis();

    expect(result).not.toBeNull();
    expect(result?.latest_session.id).toBe(latest.id);
    expect(result?.previous_session?.id).toBe(previous.id);

    const exercise = result?.exercises.find(
      (item) => item.exercise_name === "Bench Press"
    );

    expect(exercise?.latest.top_set?.weight).toBe(80);
    expect(exercise?.previous?.top_set?.weight).toBe(77.5);
    expect(exercise?.changes.top_weight).toBe(2.5);
  });

  it("passes through errors from the workout history query", async () => {
    mocks.getWorkoutSessions.mockRejectedValue(
      new Error("Unable to fetch workout sessions")
    );

    await expect(getWorkoutAnalysis()).rejects.toThrow(
      "Unable to fetch workout sessions"
    );
  });
});