import { generateCoachResponse } from "@/lib/ai/client";
import { generateWorkoutPlanReasoning } from "@/lib/ai/client";
import { buildUserContext } from "@/lib/memory/context";
import {
  getCoachMessages,
  saveCoachMessage,
} from "@/lib/memory/coach";
import { buildCoachPrompt } from "@/lib/ai/coach/prompt";
import { buildWorkoutPlanPrompt } from "@/lib/ai/coach/workout-plan-prompt";
import { getWorkoutAnalysis } from "@/lib/workout/workout-service";
import { generateWorkoutPlan } from "@/lib/planning/workout-plan";
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

    let workoutPlan = null;

    if (workoutAnalysis) {
      const deterministicPlan =
        generateWorkoutPlan(workoutAnalysis);

      if (deterministicPlan.exercises.length > 0) {
        const workoutPlanPrompt =
          buildWorkoutPlanPrompt({
            plan: deterministicPlan,
          });

        const reasoning =
          await generateWorkoutPlanReasoning(
            workoutPlanPrompt
          );

        workoutPlan = {
          exercises:
            deterministicPlan.exercises.map(
              (exercise) => {
                const matchingReasoning =
                  reasoning.exercises.find(
                    (item) =>
                      item.exerciseName ===
                      exercise.exerciseName
                  );

                return {
                  ...exercise,
                  reasoning:
                    matchingReasoning?.reasoning ??
                    "Recommendation generated from your workout history.",
                };
              }
            ),
        };
      }
    }

    await saveCoachMessage("user", question);
    await saveCoachMessage("assistant", response.answer);

    return NextResponse.json({
      success: true,
      answer: response.answer,
      workoutPlan,
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