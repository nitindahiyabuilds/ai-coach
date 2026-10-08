import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWorkoutAnalysis: vi.fn(),
  generateWorkoutPlan: vi.fn(),
}));

vi.mock("@/lib/workout/workout-service", () => ({
  getWorkoutAnalysis: mocks.getWorkoutAnalysis,
}));

vi.mock("@/lib/planning/workout-plan", () => ({
  generateWorkoutPlan: mocks.generateWorkoutPlan,
}));

import {
  buildWorkoutIntelligence,
  getWorkoutPlan,
} from "@/lib/workout/workout-intelligence";

import type {
  WorkoutAnalysis,
} from "@/lib/workout/workout";

describe("buildWorkoutIntelligence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns needs_baseline when there is no workout history", () => {
    const result = buildWorkoutIntelligence(null);

    expect(result).toEqual({
      status: "needs_baseline",
    });

    expect(mocks.generateWorkoutPlan).not.toHaveBeenCalled();
  });

  it("generates a ready plan when workout history exists", () => {
    const analysis: WorkoutAnalysis = {
      latest_session: {
        id: "session-1",
        user_id: "user-1",
        date: "2026-08-31",
        started_at: null,
        completed_at: "2026-08-31T10:00:00Z",
        notes: null,
        post_workout_feedback: null,
        created_at: "2026-08-31T09:00:00Z",
        workout_sets: [],
      },
      previous_session: null,
      exercises: [
        {
          exercise_name: "Bench Press",
          latest: {
            session_date: "2026-08-31",
            sets: [],
            total_volume: 0,
            top_set: null,
          },
          previous: null,
          trend: [],
          days_since_last_trained: 0,
          changes: {
            top_weight: null,
            top_reps: null,
            total_volume: null,
          },
        },
      ],
    };

    const plan = {
      exercises: [
        {
          exerciseName: "Bench Press",
          sets: 2,
          reps: 8,
          weight: 82.5,
          decision: "progress" as const,
          reasonCode: "progressed" as const,
          daysSinceLastTrained: 3,
        },
      ],
    };

    mocks.generateWorkoutPlan.mockReturnValue(plan);

    const result = buildWorkoutIntelligence(analysis);

    expect(mocks.generateWorkoutPlan).toHaveBeenCalledTimes(1);
    expect(mocks.generateWorkoutPlan).toHaveBeenCalledWith(
      analysis
    );

    expect(result).toEqual({
      status: "ready",
      plan,
    });
  });

  it("does not replace deterministic planning with another decision layer", () => {
    const analysis: WorkoutAnalysis = {
      latest_session: {
        id: "session-1",
        user_id: "user-1",
        date: "2026-08-31",
        started_at: null,
        completed_at: "2026-08-31T10:00:00Z",
        notes: null,
        post_workout_feedback: null,
        created_at: "2026-08-31T09:00:00Z",
        workout_sets: [],
      },
      previous_session: null,
      exercises: [],
    };

    mocks.generateWorkoutPlan.mockReturnValue({
      exercises: [],
    });

    buildWorkoutIntelligence(analysis);

    expect(mocks.generateWorkoutPlan).toHaveBeenCalledTimes(1);
  });
});

describe("getWorkoutPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes history input to the workout analysis layer", async () => {
    const analysis: WorkoutAnalysis = {
      latest_session: {
        id: "session-1",
        user_id: "user-1",
        date: "2026-08-31",
        started_at: null,
        completed_at: "2026-08-31T10:00:00Z",
        notes: null,
        post_workout_feedback: null,
        created_at: "2026-08-31T09:00:00Z",
        workout_sets: [],
      },
      previous_session: null,
      exercises: [],
    };

    mocks.getWorkoutAnalysis.mockResolvedValue(analysis);
    mocks.generateWorkoutPlan.mockReturnValue({
      exercises: [],
    });

    const input = {
      from: "2026-08-01",
      to: "2026-08-31",
      limit: 10,
      offset: 0,
    };

    await getWorkoutPlan(input);

    expect(mocks.getWorkoutAnalysis).toHaveBeenCalledTimes(1);
    expect(mocks.getWorkoutAnalysis).toHaveBeenCalledWith(input);
  });

  it("returns needs_baseline when there is no workout history", async () => {
    mocks.getWorkoutAnalysis.mockResolvedValue(null);

    const result = await getWorkoutPlan();

    expect(result).toEqual({
      status: "needs_baseline",
    });

    expect(mocks.generateWorkoutPlan).not.toHaveBeenCalled();
  });

  it("returns a ready plan when workout history exists", async () => {
    const analysis: WorkoutAnalysis = {
      latest_session: {
        id: "session-1",
        user_id: "user-1",
        date: "2026-08-31",
        started_at: null,
        completed_at: "2026-08-31T10:00:00Z",
        notes: null,
        post_workout_feedback: null,
        created_at: "2026-08-31T09:00:00Z",
        workout_sets: [],
      },
      previous_session: null,
      exercises: [],
    };

    const plan = {
      exercises: [],
    };

    mocks.getWorkoutAnalysis.mockResolvedValue(analysis);
    mocks.generateWorkoutPlan.mockReturnValue(plan);

    const result = await getWorkoutPlan();

    expect(result).toEqual({
      status: "ready",
      plan,
    });

    expect(mocks.generateWorkoutPlan).toHaveBeenCalledTimes(1);
    expect(mocks.generateWorkoutPlan).toHaveBeenCalledWith(
      analysis
    );
  });

  it("passes through analysis errors", async () => {
    mocks.getWorkoutAnalysis.mockRejectedValue(
      new Error("Unable to fetch workout analysis")
    );

    await expect(getWorkoutPlan()).rejects.toThrow(
      "Unable to fetch workout analysis"
    );

    expect(mocks.generateWorkoutPlan).not.toHaveBeenCalled();
  });
});