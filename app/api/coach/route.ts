import { generateCoachResponse } from "@/lib/ai/client";
import { buildUserContext } from "@/lib/memory/context";
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

    const context = await buildUserContext();

    const prompt = `
You are the AI health coach inside AI OS.

Your job is to provide useful, practical, and personalized health and fitness guidance.

Use the user's context below when it is relevant.

Do not invent user information.

Do not recalculate health metrics yourself. The application has already calculated them.

For health, fitness, nutrition, or lifestyle questions, provide clear and practical guidance.

If the question requires information that is not available in the user's context, say so rather than inventing it.

USER CONTEXT:

${JSON.stringify(context, null, 2)}

USER QUESTION:

${parsed.data.question}

Return your response as JSON with exactly this structure:

{
  "answer": "your answer here"
}
`;

    const response = await generateCoachResponse(prompt);

    return NextResponse.json({
      success: true,
      response,
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