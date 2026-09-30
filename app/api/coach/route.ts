import { NextResponse } from "next/server";
import { z } from "zod";
import {
  generateCoachResponse,
  generateWorkoutPlanReasoning,
} from "@/lib/ai/client";
import { buildUserContext } from "@/lib/memory/context";
import {
  getCoachMessages,
  saveCoachMessage,
} from "@/lib/memory/coach";
import { buildCoachPrompt } from "@/lib/ai/coach/prompt";
import { buildWorkoutPlanPrompt } from "@/lib/ai/coach/workout-plan-prompt";
import { getWorkoutAnalysis } from "@/lib/workout/workout-service";
import { buildWorkoutIntelligence } from "@/lib/workout/workout-intelligence";
import { isWorkoutPlanRelevant } from "@/lib/workout/workout-plan-relevance";
import type {
  CoachErrorResponse,
  CoachResponse,
} from "@/lib/contracts/coach";
import type { WorkoutPlan } from "@/lib/contracts/workout";

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

      return NextResponse.json(
        errorResponse,
        { status: 400 }
      );
    }

    const question = parsed.data.question;

    const context = await buildUserContext();
    const workoutAnalysis = await getWorkoutAnalysis();
    const workoutIntelligence =
      buildWorkoutIntelligence(workoutAnalysis);
    const history = await getCoachMessages(20);

    const prompt = buildCoachPrompt({
      context,
      workoutAnalysis,
      workoutIntelligenceStatus:
        workoutIntelligence.status,
      history,
      question,
    });

    const response = await generateCoachResponse(prompt);

    let workoutPlan: WorkoutPlan | null = null;

    if (
      isWorkoutPlanRelevant(question) &&
      workoutIntelligence.status === "ready"
    ) {
      const deterministicPlan = workoutIntelligence.plan;

      if (deterministicPlan.exercises.length > 0) {
        const workoutPlanPrompt = buildWorkoutPlanPrompt({
          plan: deterministicPlan,
        });

        const reasoning =
          await generateWorkoutPlanReasoning(
            workoutPlanPrompt
          );

        workoutPlan = {
          exercises: deterministicPlan.exercises.map(
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

    try {
      await saveCoachMessage("user", question);
      await saveCoachMessage(
        "assistant",
        response.answer
      );
    } catch (error) {
      console.error(
        "Failed to persist coach messages:",
        error
      );
    }

    const coachResponse: CoachResponse = {
      success: true,
      answer: response.answer,
      workoutPlan,
    };

    return NextResponse.json(coachResponse);
  } catch (error) {
    console.error("Coach request failed:", error);

    const errorResponse: CoachErrorResponse = {
      success: false,
      message: "Unable to generate a coach response.",
    };

    return NextResponse.json(
      errorResponse,
      { status: 500 }
    );
  }
}