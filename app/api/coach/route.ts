import { NextResponse } from "next/server";
import { z } from "zod";
import { generateCoachResponseForUser } from "@/lib/ai/coach/service";
import type { CoachErrorResponse } from "@/lib/contracts/coach";

const coachRequestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = coachRequestSchema.safeParse(body);

    if (!parsed.success) {
      const errorResponse: CoachErrorResponse = {
        success: false,
        message: "A valid question is required.",
      };

      return NextResponse.json(errorResponse, { status: 400 });
    }

    const coachResponse =
      await generateCoachResponseForUser(
        parsed.data.question,
      );

    return NextResponse.json(coachResponse);
  } catch (error) {
    console.error("Coach request failed:", error);

    const errorResponse: CoachErrorResponse = {
      success: false,
      message: "Unable to generate a coach response.",
    };

    return NextResponse.json(
      errorResponse,
      { status: 500 },
    );
  }
}
