import { generateHealthExplanation } from "@/lib/ai/client";
import { buildUserContext } from "@/lib/memory/context";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const context = await buildUserContext();

    const prompt = `
You are the AI health coach inside AI OS.

Your task is to explain the user's health metrics clearly and practically.

The application has already calculated the health metrics.
Treat those numbers as authoritative.

Do NOT recalculate, modify, estimate, or invent any health metric.

Use the user's profile information only as context for explaining the metrics.

USER CONTEXT:
${JSON.stringify(context, null, 2)}

Return a JSON object with exactly these fields:

{
  "summary": "A short overall explanation.",
  "bmr": "Explain the user's BMR and why it matters.",
  "tdee": "Explain the user's TDEE and why it matters.",
  "calories": "Explain the user's daily calorie target and why it matters for their goal.",
  "protein": "Explain the user's protein target and why it matters for their goal.",
  "water": "Explain the user's water target and why it matters."
}

Rules:

- Keep each explanation concise.
- Do not create a workout plan.
- Do not create a meal plan.
- Do not give medical diagnoses.
- Do not invent information that is not present in the context.
- Do not change any calculated number.
- Keep the tone friendly and practical.
`;

    const response = await generateHealthExplanation(prompt);

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("AI test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "AI request failed",
      },
      { status: 500 }
    );
  }
}