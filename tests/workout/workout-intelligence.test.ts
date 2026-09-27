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

import { getWorkoutPlan } from "@/lib/workout/workout-intelligence";

describe("getWorkoutPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes history input to the workout analysis layer", async () => {
    const analysis = {
      latest_session: {
        id: "session-1",
      },
      previous_session: null,
      exercises: [],
    };

    mocks.getWorkoutAnalysis.mockResolvedValue(analysis);

    const input = {
      from: "2026-08-01",
      to: "2026-08-31",
      limit: 10,
      offset: 0,
    };

    mocks.generateWorkoutPlan.mockReturnValue({
      exercises: [],
    });

    await getWorkoutPlan(input);

    expect(mocks.getWorkoutAnalysis).toHaveBeenCalledTimes(1);
    expect(mocks.getWorkoutAnalysis).toHaveBeenCalledWith(input);
  });

  it("returns null when there is no workout analysis", async () => {
    mocks.getWorkoutAnalysis.mockResolvedValue(null);

    const result = await getWorkoutPlan();

    expect(result).toBeNull();
    expect(mocks.generateWorkoutPlan).not.toHaveBeenCalled();
  });

  it("passes workout analysis into the deterministic plan generator", async () => {
    const analysis = {
      latest_session: {
        id: "session-1",
      },
      previous_session: null,
      exercises: [
        {
          exercise_name: "Bench Press",
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
          decision: "progress",
          reasonCode: "progressed",
          daysSinceLastTrained: 3,
        },
      ],
    };

    mocks.getWorkoutAnalysis.mockResolvedValue(analysis);
    mocks.generateWorkoutPlan.mockReturnValue(plan);

    const result = await getWorkoutPlan();

    expect(mocks.generateWorkoutPlan).toHaveBeenCalledTimes(1);
    expect(mocks.generateWorkoutPlan).toHaveBeenCalledWith(
      analysis
    );
    expect(result).toEqual(plan);
  });

  it("does not replace deterministic planning with another decision layer", async () => {
    const analysis = {
      latest_session: {
        id: "session-1",
      },
      previous_session: null,
      exercises: [],
    };

    const plan = {
      exercises: [],
    };

    mocks.getWorkoutAnalysis.mockResolvedValue(analysis);
    mocks.generateWorkoutPlan.mockReturnValue(plan);

    await getWorkoutPlan();

    expect(mocks.generateWorkoutPlan).toHaveBeenCalledTimes(1);
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