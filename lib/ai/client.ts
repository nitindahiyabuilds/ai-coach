import {
  coachResponseSchema,
  healthExplanationSchema,
  type CoachResponse,
  type HealthExplanation,
} from "./schema";
import {
  workoutPlanReasoningSchema,
  type WorkoutPlanReasoning,
} from "./coach/workout-plan";
import { createAIProvider } from "./provider-factory";

const aiProvider = createAIProvider();

export async function generateHealthExplanation(
  prompt: string,
): Promise<HealthExplanation> {
  const response = await aiProvider.generateStructuredResponse({
    prompt,
    schemaName: "health_explanation",
    schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        bmr: { type: "string" },
        tdee: { type: "string" },
        calories: { type: "string" },
        protein: { type: "string" },
        water: { type: "string" },
      },
      required: ["summary", "bmr", "tdee", "calories", "protein", "water"],
      additionalProperties: false,
    },
  });

  const result = healthExplanationSchema.safeParse(response);

  if (!result.success) {
    throw new Error("AI returned an invalid response structure");
  }

  return result.data;
}

export async function generateCoachResponse(
  prompt: string,
): Promise<CoachResponse> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await aiProvider.generateStructuredResponse({
        prompt,
        schemaName: "coach_response",
        schema: {
          type: "object",
          properties: {
            answer: { type: "string" },
          },
          required: ["answer"],
          additionalProperties: false,
        },
      });

      const result = coachResponseSchema.safeParse(response);

      if (!result.success) {
        throw new Error("AI returned an invalid response structure");
      }

      return result.data;
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? (error as { status?: number }).status
          : undefined;

      if (status !== 503 || attempt === maxAttempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  throw new Error("AI request failed");
}

export async function generateWorkoutPlanReasoning(
  prompt: string,
): Promise<WorkoutPlanReasoning> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await aiProvider.generateStructuredResponse({
        prompt,
        schemaName: "workout_plan_reasoning",
        schema: {
          type: "object",
          properties: {
            exercises: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  exerciseName: { type: "string" },
                  reasoning: { type: "string" },
                },
                required: ["exerciseName", "reasoning"],
                additionalProperties: false,
              },
            },
          },
          required: ["exercises"],
          additionalProperties: false,
        },
      });

      const result = workoutPlanReasoningSchema.safeParse(response);

      if (!result.success) {
        throw new Error(
          "AI returned an invalid workout plan reasoning structure",
        );
      }

      return result.data;
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? (error as { status?: number }).status
          : undefined;

      if (status !== 503 || attempt === maxAttempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  throw new Error("Workout plan reasoning request failed");
}
