import { GoogleGenAI } from "@google/genai";
import {
  healthExplanationSchema,
  type HealthExplanation,
} from "./schema";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

const ai = new GoogleGenAI({
  apiKey,
});

export async function generateHealthExplanation(
  prompt: string
): Promise<HealthExplanation> {
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          summary: {
            type: "STRING",
          },
          bmr: {
            type: "STRING",
          },
          tdee: {
            type: "STRING",
          },
          calories: {
            type: "STRING",
          },
          protein: {
            type: "STRING",
          },
          water: {
            type: "STRING",
          },
        },
        required: [
          "summary",
          "bmr",
          "tdee",
          "calories",
          "protein",
          "water",
        ],
      },
    },
  });

  if (!response.text) {
    throw new Error("AI returned an empty response");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(response.text);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  const result = healthExplanationSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error("AI returned an invalid response structure");
  }

  return result.data;
}