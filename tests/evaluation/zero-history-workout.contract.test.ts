import { describe, expect, it, vi } from "vitest";

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

describe("zero-history workout intelligence contract", () => {
  it("returns needs_baseline when the user has no workout history", async () => {
    mocks.getWorkoutAnalysis.mockResolvedValue(null);

    const result = await getWorkoutPlan();

    expect(result).toEqual({
      status: "needs_baseline",
    });
  });

  it("does not generate a workout plan without workout history", async () => {
    mocks.getWorkoutAnalysis.mockResolvedValue(null);

    await getWorkoutPlan();

    expect(mocks.generateWorkoutPlan).not.toHaveBeenCalled();
  });

  it("does not fabricate workout data for a first-time user", async () => {
    mocks.getWorkoutAnalysis.mockResolvedValue(null);

    const result = await getWorkoutPlan();

    expect(result).not.toHaveProperty("plan");
    expect(result).toEqual({
      status: "needs_baseline",
    });
  });
});