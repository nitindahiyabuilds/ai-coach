import { describe, expect, it } from "vitest";
import { calculateBMR } from "@/lib/calculations/bmr";
import type { UserProfile } from "@/lib/calculations/types";

describe("calculateBMR", () => {
  it("calculates BMR correctly for a male profile", () => {
    const profile: UserProfile = {
      age: 30,
      sex: "male",
      height: 180,
      weight: 80,
      activityLevel: "moderate",
      goal: "maintenance",
    };

    expect(calculateBMR(profile)).toBe(1780);
  });

  it("calculates BMR correctly for a female profile", () => {
    const profile: UserProfile = {
      age: 30,
      sex: "female",
      height: 180,
      weight: 80,
      activityLevel: "moderate",
      goal: "maintenance",
    };

    expect(calculateBMR(profile)).toBe(1614);
  });
});