import { describe, expect, it } from "vitest";
import { coachResponseSchema } from "@/lib/ai/schema";
import { workoutPlanReasoningSchema } from "@/lib/ai/coach/workout-plan";

describe("ai schema evaluation contract", () => {
  describe("coachResponseSchema", () => {
    it("accepts the required response structure", () => {
      const result = coachResponseSchema.safeParse({
        answer: "Increase your load slightly.",
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid coach response payloads", () => {
      const invalidInputs = [
        {},
        { answer: 123 },
        { answer: null },
        null,
        "not-an-object",
        { answer: undefined },
        { wrongKey: "Increase your load slightly." },
      ];

      for (const invalidInput of invalidInputs) {
        const result = coachResponseSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      }
    });
  });

  describe("workoutPlanReasoningSchema", () => {
    it("accepts valid reasoning payloads", () => {
      const result = workoutPlanReasoningSchema.safeParse({
        exercises: [
          {
            exerciseName: "Bench Press",
            reasoning: "Your recent performance supports a small progression.",
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid reasoning payloads", () => {
      const invalidInputs = [
        {},
        { exercises: null },
        { exercises: "not-an-array" },
        { exercises: [{ reasoning: "Your recent performance supports a small progression." }] },
        { exercises: [{ exerciseName: "", reasoning: "Your recent performance supports a small progression." }] },
        { exercises: [{ exerciseName: "Bench Press" }] },
        { exercises: [{ exerciseName: "Bench Press", reasoning: "" }] },
        {
          exercises: [
            {
              exerciseName: "Bench Press",
              reasoning: "a".repeat(501),
            },
          ],
        },
      ];

      for (const invalidInput of invalidInputs) {
        const result = workoutPlanReasoningSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      }
    });
  });
});
