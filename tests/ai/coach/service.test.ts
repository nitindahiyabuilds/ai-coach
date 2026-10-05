import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buildPersonalContext: vi.fn(),
  retrievePersonalMemoryFacts: vi.fn(),
  getWorkoutAnalysis: vi.fn(),
  buildWorkoutIntelligence: vi.fn(),
  getCoachMessages: vi.fn(),
  saveCoachMessage: vi.fn(),
  generateCoachResponse: vi.fn(),
  generateWorkoutPlanReasoning: vi.fn(),
  buildCoachPrompt: vi.fn(),
  buildWorkoutPlanPrompt: vi.fn(),
  isWorkoutPlanRelevant: vi.fn(),
}));

vi.mock("@/lib/ai/client", () => ({
  generateCoachResponse: mocks.generateCoachResponse,
  generateWorkoutPlanReasoning:
    mocks.generateWorkoutPlanReasoning,
}));

vi.mock("@/lib/ai/coach/prompt", () => ({
  buildCoachPrompt: mocks.buildCoachPrompt,
}));

vi.mock("@/lib/ai/coach/workout-plan-prompt", () => ({
  buildWorkoutPlanPrompt:
    mocks.buildWorkoutPlanPrompt,
}));

vi.mock("@/lib/memory/coach", () => ({
  getCoachMessages: mocks.getCoachMessages,
  saveCoachMessage: mocks.saveCoachMessage,
}));

vi.mock("@/lib/memory/context", () => ({
  buildPersonalContext:
    mocks.buildPersonalContext,
}));

vi.mock("@/lib/memory/retrieval", () => ({
  retrievePersonalMemoryFacts:
    mocks.retrievePersonalMemoryFacts,
}));

vi.mock("@/lib/workout/workout-service", () => ({
  getWorkoutAnalysis:
    mocks.getWorkoutAnalysis,
}));

vi.mock("@/lib/workout/workout-intelligence", () => ({
  buildWorkoutIntelligence:
    mocks.buildWorkoutIntelligence,
}));

vi.mock("@/lib/workout/workout-plan-relevance", () => ({
  isWorkoutPlanRelevant:
    mocks.isWorkoutPlanRelevant,
}));

import { generateCoachResponseForUser } from "@/lib/ai/coach/service";

const deterministicPlan = {
  exercises: [
    {
      exerciseName: "Bench Press",
      sets: 3,
      reps: 8,
      weight: 82.5,
      decision: "progress" as const,
      reasonCode: "progressed" as const,
      daysSinceLastTrained: 2,
    },
    {
      exerciseName: "Squat",
      sets: 3,
      reps: 6,
      weight: 100,
      decision: "hold" as const,
      reasonCode: "maintain_after_decline" as const,
      daysSinceLastTrained: 3,
    },
  ],
};

const personalContext = {
  profile: {
    age: 25,
    sex: "male" as const,
    height_cm: 180,
    weight_kg: 80,
    activity_level: "moderate" as const,
    goal: "muscle_gain" as const,
    training_experience: "intermediate",
    equipment: "gym",
    dietary_preference: "none",
    region: "India",
  },
  healthMetrics: {
    bmr: 1800,
    tdee: 2790,
    calories: 3090,
    protein: 160,
    water: 3,
  },
};

function setupDefaultMocks() {
  mocks.buildPersonalContext.mockResolvedValue(
    personalContext,
  );

  mocks.retrievePersonalMemoryFacts.mockResolvedValue(
    [],
  );

  mocks.getWorkoutAnalysis.mockResolvedValue({
    exercises: [],
  });

  mocks.buildWorkoutIntelligence.mockReturnValue({
    status: "ready",
    plan: deterministicPlan,
  });

  mocks.getCoachMessages.mockResolvedValue([]);

  mocks.saveCoachMessage.mockResolvedValue(
    undefined,
  );

  mocks.generateCoachResponse.mockResolvedValue({
    answer: "Your workout is ready.",
  });

  mocks.generateWorkoutPlanReasoning.mockResolvedValue({
    exercises: [
      {
        exerciseName: "Bench Press",
        reasoning:
          "Progressing the load is appropriate based on the deterministic progression decision.",
      },
      {
        exerciseName: "Squat",
        reasoning:
          "Maintaining the current load is appropriate after the recent decline.",
      },
    ],
  });

  mocks.buildCoachPrompt.mockReturnValue(
    "coach prompt",
  );

  mocks.buildWorkoutPlanPrompt.mockReturnValue(
    "workout plan reasoning prompt",
  );

  mocks.isWorkoutPlanRelevant.mockReturnValue(
    true,
  );
}

describe("generateCoachResponseForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it("attaches valid AI reasoning to the deterministic plan", async () => {
    const result =
      await generateCoachResponseForUser(
        "What should I do today?",
      );

    expect(result.workoutPlan).toEqual({
      exercises: [
        {
          ...deterministicPlan.exercises[0],
          reasoning:
            "Progressing the load is appropriate based on the deterministic progression decision.",
        },
        {
          ...deterministicPlan.exercises[1],
          reasoning:
            "Maintaining the current load is appropriate after the recent decline.",
        },
      ],
    });
  });

  it("preserves the deterministic plan when AI reasoning omits an exercise", async () => {
    mocks.generateWorkoutPlanReasoning.mockResolvedValue(
      {
        exercises: [
          {
            exerciseName: "Bench Press",
            reasoning: "Bench press reasoning.",
          },
        ],
      },
    );

    const result =
      await generateCoachResponseForUser(
        "What should I do today?",
      );

    expect(result.workoutPlan).toEqual({
      exercises:
        deterministicPlan.exercises.map(
          (exercise) => ({
            ...exercise,
            reasoning:
              "Recommendation generated from your workout history.",
          }),
        ),
    });
  });

  it("preserves the deterministic plan when AI reasoning introduces an unknown exercise", async () => {
    mocks.generateWorkoutPlanReasoning.mockResolvedValue(
      {
        exercises: [
          {
            exerciseName: "Bench Press",
            reasoning: "Bench press reasoning.",
          },
          {
            exerciseName: "Deadlift",
            reasoning: "Deadlift reasoning.",
          },
        ],
      },
    );

    const result =
      await generateCoachResponseForUser(
        "What should I do today?",
      );

    expect(result.workoutPlan).toEqual({
      exercises:
        deterministicPlan.exercises.map(
          (exercise) => ({
            ...exercise,
            reasoning:
              "Recommendation generated from your workout history.",
          }),
        ),
    });
  });

  it("preserves the deterministic plan when AI reasoning contains a duplicate exercise", async () => {
    mocks.generateWorkoutPlanReasoning.mockResolvedValue(
      {
        exercises: [
          {
            exerciseName: "Bench Press",
            reasoning:
              "First bench press reasoning.",
          },
          {
            exerciseName: "Bench Press",
            reasoning:
              "Second bench press reasoning.",
          },
        ],
      },
    );

    const result =
      await generateCoachResponseForUser(
        "What should I do today?",
      );

    expect(result.workoutPlan).toEqual({
      exercises:
        deterministicPlan.exercises.map(
          (exercise) => ({
            ...exercise,
            reasoning:
              "Recommendation generated from your workout history.",
          }),
        ),
    });
  });

  it("never uses AI reasoning to modify deterministic workout fields", async () => {
    mocks.generateWorkoutPlanReasoning.mockResolvedValue(
      {
        exercises: [
          {
            exerciseName: "Bench Press",
            reasoning:
              "Use 100kg for 5 sets of 5 instead.",
          },
          {
            exerciseName: "Squat",
            reasoning:
              "Use 120kg for 4 sets of 8 instead.",
          },
        ],
      },
    );

    const result =
      await generateCoachResponseForUser(
        "What should I do today?",
      );

    expect(result.workoutPlan?.exercises).toEqual([
      {
        ...deterministicPlan.exercises[0],
        reasoning:
          "Use 100kg for 5 sets of 5 instead.",
      },
      {
        ...deterministicPlan.exercises[1],
        reasoning:
          "Use 120kg for 4 sets of 8 instead.",
      },
    ]);
  });

  it("preserves the deterministic plan when AI reasoning generation fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mocks.generateWorkoutPlanReasoning.mockRejectedValue(
      new Error("AI provider unavailable"),
    );

    const result =
      await generateCoachResponseForUser(
        "What should I do today?",
      );

    expect(result.workoutPlan).toEqual({
      exercises:
        deterministicPlan.exercises.map(
          (exercise) => ({
            ...exercise,
            reasoning:
              "Recommendation generated from your workout history.",
          }),
        ),
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to generate workout plan reasoning:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });
});