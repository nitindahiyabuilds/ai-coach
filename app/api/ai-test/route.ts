import { generateAIResponse } from "@/lib/ai/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await generateAIResponse(
      "Explain in one short paragraph what BMR means."
    );

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