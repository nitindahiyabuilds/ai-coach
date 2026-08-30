import { describe, expect, it } from "vitest";
import { buildCoachPrompt } from "@/lib/ai/coach/prompt";
import { buildWorkoutPlanPrompt } from "@/lib/ai/coach/workout-plan-prompt";

describe("ai boundary evaluation contract", () => {
  it("keeps deterministic workout-plan reasoning separate from AI decision-making", () => {
    const prompt = buildWorkoutPlanPrompt({
      plan: {
        exercises: [],
      },
    });

    expect(prompt).toContain(
      "The exercise name, sets, reps, weight, and decision are authoritative."
    );
    expect(prompt).toContain("DO NOT change them.");
    expect(prompt).toContain("DO NOT invent different weights, reps, or sets.");
    expect(prompt).toContain("DO NOT make progression decisions.");
    expect(prompt).toContain(
      "Your only job is to explain why each deterministic recommendation makes sense."
    );
  });

  it("treats workout analysis as application-generated facts and keeps calculations deterministic", () => {
    const prompt = buildCoachPrompt({
      context: {},
      workoutAnalysis: null,
      history: [],
      question: "How should I train this week?",
    });

    expect(prompt).toContain(
      "Treat workout analysis as factual application-generated data."
    );
    expect(prompt).toContain("Do not invent workout data.");
    expect(prompt).toContain(
      "deterministic calculations remain the responsibility of the application."
    );
  });
});
