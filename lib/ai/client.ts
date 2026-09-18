import OpenAI from "openai";
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
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  throw new Error("GROQ_API_KEY is not configured");
}
const ai = new OpenAI({
  apiKey,
  baseURL: "https://api.groq.com/openai/v1",
});
const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
export async function generateHealthExplanation(
  prompt: string
): Promise<HealthExplanation> {
  const response = await ai.responses.create({
    model,
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: "health_explanation",
        strict: true,
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
          required: [
            "summary",
            "bmr",
            "tdee",
            "calories",
            "protein",
            "water",
          ],
          additionalProperties: false,
        },
      },
    },
  });
  if (!response.output_text) {
    throw new Error("AI returned an empty response");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(response.output_text);
  } catch {
    throw new Error("AI returned invalid JSON");
  }
  const result = healthExplanationSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("AI returned an invalid response structure");
  }
  return result.data;
}
export async function generateCoachResponse(
  prompt: string
): Promise<CoachResponse> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.responses.create({
        model,
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "coach_response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                answer: { type: "string" },
              },
              required: ["answer"],
              additionalProperties: false,
            },
          },
        },
      });
      if (!response.output_text) {
        throw new Error("AI returned an empty response");
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(response.output_text);
      } catch {
        throw new Error("AI returned invalid JSON");
      }
      const result = coachResponseSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error("AI returned an invalid response structure");
      }
      return result.data;
    } catch (error) {
      const status =
        typeof error === "object" &&
        error !== null &&
        "status" in error
          ? (error as { status?: number }).status
          : undefined;
      if (status !== 503 || attempt === maxAttempts) {
        throw error;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, attempt * 1000)
      );
    }
  }
  throw new Error("AI request failed");
}
export async function generateWorkoutPlanReasoning(
  prompt: string
): Promise<WorkoutPlanReasoning> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.responses.create({
        model,
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "workout_plan_reasoning",
            strict: true,
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
                    required: [
                      "exerciseName",
                      "reasoning",
                    ],
                    additionalProperties: false,
                  },
                },
              },
              required: ["exercises"],
              additionalProperties: false,
            },
          },
        },
      });
      if (!response.output_text) {
        throw new Error("AI returned an empty response");
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(response.output_text);
      } catch {
        throw new Error("AI returned invalid JSON");
      }
      const result =
        workoutPlanReasoningSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(
          "AI returned an invalid workout plan reasoning structure"
        );
      }
      return result.data;
    } catch (error) {
      const status =
        typeof error === "object" &&
        error !== null &&
        "status" in error
          ? (error as { status?: number }).status
          : undefined;
      if (status !== 503 || attempt === maxAttempts) {
        throw error;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, attempt * 1000)
      );
    }
  }
  throw new Error(
    "Workout plan reasoning request failed"
  );
}
