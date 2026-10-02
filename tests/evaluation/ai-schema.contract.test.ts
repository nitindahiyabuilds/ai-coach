import { describe, expect, it } from "vitest";
import {
  coachResponseSchema,
  personalMemoryExtractionSchema,
} from "@/lib/ai/schema";
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
            reasoning:
              "Your recent performance supports a small progression.",
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
        {
          exercises: [
            {
              reasoning:
                "Your recent performance supports a small progression.",
            },
          ],
        },
        {
          exercises: [
            {
              exerciseName: "",
              reasoning:
                "Your recent performance supports a small progression.",
            },
          ],
        },
        {
          exercises: [
            {
              exerciseName: "Bench Press",
            },
          ],
        },
        {
          exercises: [
            {
              exerciseName: "Bench Press",
              reasoning: "",
            },
          ],
        },
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

  describe("personalMemoryExtractionSchema", () => {
    it("accepts a confirmed personal fact", () => {
      const result = personalMemoryExtractionSchema.safeParse({
        facts: [
          {
            fact: "User prefers morning workouts.",
            category: "preference",
            evidence: "confirmed",
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it("accepts an inferred personal fact", () => {
      const result = personalMemoryExtractionSchema.safeParse({
        facts: [
          {
            fact: "User may prefer training early in the day.",
            category: "preference",
            evidence: "inferred",
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it("accepts multiple facts", () => {
      const result = personalMemoryExtractionSchema.safeParse({
        facts: [
          {
            fact: "User prefers morning workouts.",
            category: "preference",
            evidence: "confirmed",
          },
          {
            fact: "User has limited evening availability.",
            category: "constraint",
            evidence: "confirmed",
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it("accepts an empty facts array", () => {
      const result = personalMemoryExtractionSchema.safeParse({
        facts: [],
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid extraction payloads", () => {
      const invalidInputs = [
        {},
        { facts: null },
        { facts: "not-an-array" },
        {
          facts: [
            {
              category: "preference",
              evidence: "confirmed",
            },
          ],
        },
        {
          facts: [
            {
              fact: "",
              category: "preference",
              evidence: "confirmed",
            },
          ],
        },
        {
          facts: [
            {
              fact: "User prefers mornings.",
              category: "invalid",
              evidence: "confirmed",
            },
          ],
        },
        {
          facts: [
            {
              fact: "User prefers mornings.",
              category: "preference",
              evidence: "observed",
            },
          ],
        },
        {
          facts: [
            {
              fact: "User prefers mornings.",
              category: "preference",
              evidence: "confirmed",
              source: "user",
            },
          ],
        },
        {
          facts: [
            {
              fact: "User prefers mornings.",
              category: "preference",
              evidence: "confirmed",
              status: "active",
            },
          ],
        },
        {
          facts: [
            {
              fact: "User prefers mornings.",
              category: "preference",
              evidence: "confirmed",
              supersedes_id: null,
            },
          ],
        },
        {
          facts: [
            {
              fact: "User prefers mornings.",
              category: "preference",
              evidence: "confirmed",
              id: "unexpected",
            },
          ],
        },
        {
          facts: [
            {
              fact: "User prefers mornings.",
              category: "preference",
              evidence: "confirmed",
              created_at: "2026-10-02",
            },
          ],
        },
        {
          facts: [
            {
              fact: "User prefers mornings.",
              category: "preference",
              evidence: "confirmed",
              updated_at: "2026-10-02",
            },
          ],
        },
        {
          facts: [
            {
              fact: "User prefers mornings.",
              category: "preference",
              evidence: "confirmed",
              extra: "not allowed",
            },
          ],
        },
      ];

      for (const invalidInput of invalidInputs) {
        const result =
          personalMemoryExtractionSchema.safeParse(invalidInput);

        if (result.success) {
          throw new Error(
            `UNEXPECTED VALID INPUT: ${JSON.stringify(invalidInput)}`,
          );
        }

        expect(result.success).toBe(false);
      }
    });
  });
});