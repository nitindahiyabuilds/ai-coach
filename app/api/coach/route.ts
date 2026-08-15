import { generateCoachResponse } from "@/lib/ai/client";
import { buildUserContext } from "@/lib/memory/context";
import {
  getCoachMessages,
  saveCoachMessage,
} from "@/lib/memory/coach";
import { buildCoachPrompt } from "@/lib/ai/coach/prompt";
import { getWorkoutAnalysis } from "@/lib/analysis/workout-service";
import { NextResponse } from "next/server";
import { z } from "zod";

const coachRequestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = coachRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid question is required.",
        },
        { status: 400 }
      );
    }

    const question = parsed.data.question;

    const context = await buildUserContext();

    const workoutAnalysis = await getWorkoutAnalysis();

    const history = await getCoachMessages(20);

    const prompt = buildCoachPrompt({
      context,
      workoutAnalysis,
      history,
      question,
    });

    const response = await generateCoachResponse(prompt);

    await saveCoachMessage("user", question);
    await saveCoachMessage("assistant", response.answer);

    return NextResponse.json({
      success: true,
      answer: response.answer,
    });
  } catch (error) {
    console.error("Coach request failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to generate a coach response.",
      },
      { status: 500 }
    );
  }
}