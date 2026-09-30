import { describe, expect, it } from "vitest";
import { isWorkoutPlanRelevant } from "@/lib/workout/workout-plan-relevance";

describe("isWorkoutPlanRelevant", () => {
  it("detects requests for a workout plan", () => {
    expect(isWorkoutPlanRelevant("What should I do for my next workout?")).toBe(
      true
    );
  });

  it("detects progression questions", () => {
    expect(isWorkoutPlanRelevant("Should I increase my bench weight?")).toBe(
      true
    );
  });

  it("detects exercise recommendations", () => {
    expect(
      isWorkoutPlanRelevant("What exercises should I do today?")
    ).toBe(true);
  });

  it("detects workout routine requests", () => {
    expect(isWorkoutPlanRelevant("Can you give me a workout routine?")).toBe(
      true
    );
  });

  it("detects weight and rep questions", () => {
    expect(
      isWorkoutPlanRelevant("What weight and reps should I use?")
    ).toBe(true);
  });

  it("does not trigger for nutrition questions", () => {
    expect(isWorkoutPlanRelevant("What should I eat today?")).toBe(false);
  });

  it("does not trigger for hydration questions", () => {
    expect(isWorkoutPlanRelevant("How much water should I drink?")).toBe(false);
  });

  it("does not trigger for general health questions", () => {
    expect(isWorkoutPlanRelevant("Why am I feeling tired today?")).toBe(false);
  });

  it("does not trigger for workout history questions", () => {
    expect(isWorkoutPlanRelevant("What did I do in my last workout?")).toBe(
      false
    );
  });

  it("does not trigger for empty questions", () => {
    expect(isWorkoutPlanRelevant("")).toBe(false);
  });
});