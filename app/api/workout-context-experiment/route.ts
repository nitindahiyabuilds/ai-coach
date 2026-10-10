import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/user";
import {
  generateCoachResponse,
  generateWorkoutPlanReasoning,
} from "@/lib/ai/client";
import { buildCoachPrompt } from "@/lib/ai/coach/prompt";
import { buildWorkoutPlanPrompt } from "@/lib/ai/coach/workout-plan-prompt";
import { getCoachMessages } from "@/lib/memory/coach";
import { buildPersonalContext } from "@/lib/memory/context";
import { retrievePersonalMemoryFacts } from "@/lib/memory/retrieval";
import { getWorkoutAnalysis } from "@/lib/workout/workout-service";
import { buildWorkoutIntelligence } from "@/lib/workout/workout-intelligence";
import type { WorkoutPlan } from "@/lib/contracts/workout";
import type { PersonalMemorySearchResult } from "@/lib/contracts/personal-memory-retrieval";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This experiment is available only in development." },
      { status: 404 },
    );
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("question" in body) ||
      typeof body.question !== "string" ||
      !body.question.trim() ||
      body.question.length > 2000
    ) {
      return NextResponse.json(
        { error: "Provide a valid question of at most 2000 characters." },
        { status: 400 },
      );
    }

    const question = body.question.trim();

    const context = await buildPersonalContext();

    let personalMemories: PersonalMemorySearchResult[];

    try {
      personalMemories = await retrievePersonalMemoryFacts(question);
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        throw error;
      }

      console.error("Experiment memory retrieval failed:", error);

      return NextResponse.json(
        {
          stage: "personal_memory_retrieval",
          error:
            error instanceof Error
              ? error.message
              : "Unknown memory retrieval error",
        },
        { status: 500 },
      );
    }

    let workoutAnalysis;

    try {
      workoutAnalysis = await getWorkoutAnalysis();
    } catch (error) {
      console.error("Experiment workout retrieval failed:", error);

      return NextResponse.json(
        {
          stage: "workout_analysis",
          error:
            error instanceof Error
              ? error.message
              : "Unknown workout retrieval error",
          detail:
            error instanceof Error ? error.stack : undefined,
        },
        { status: 500 },
      );
    }

    const workoutIntelligence = buildWorkoutIntelligence(workoutAnalysis);
    const history = await getCoachMessages(20);

    const enabledPrompt = buildCoachPrompt({
      context,
      personalMemories,
      workoutAnalysis,
      workoutIntelligenceStatus: workoutIntelligence.status,
      history,
      question,
    });

    const disabledPrompt = enabledPrompt
      .replace(
        /WORKOUT INTELLIGENCE STATE:\s*[\s\S]*?\n\nWORKOUT ANALYSIS:/,
        [
          "WORKOUT INTELLIGENCE STATE:",
          "disabled for this experiment; actual history availability is not disclosed",
          "",
          "WORKOUT ANALYSIS:",
        ].join("\n"),
      )
      .replace(
        /WORKOUT ANALYSIS:\s*[\s\S]*?\n\nCONVERSATION HISTORY:/,
        [
          "WORKOUT ANALYSIS:",
          "WITHHELD FOR THIS EXPERIMENT. Do not infer that workout history is absent. Use the remaining supplied context.",
          "",
          "CONVERSATION HISTORY:",
        ].join("\n"),
      );

    const disabledResponse = await generateCoachResponse(disabledPrompt);
    const enabledResponse = await generateCoachResponse(enabledPrompt);

    let planEvidence: {
      deterministicPlan: WorkoutPlan;
      reasoning: unknown;
    } | null = null;

    if (
      workoutIntelligence.status === "ready" &&
      workoutIntelligence.plan.exercises.length > 0
    ) {
      const deterministicPlan = workoutIntelligence.plan;

      const reasoningPrompt = buildWorkoutPlanPrompt({
        plan: deterministicPlan,
      });

      const reasoning =
        await generateWorkoutPlanReasoning(reasoningPrompt);

      planEvidence = {
        deterministicPlan,
        reasoning,
      };
    }

    return NextResponse.json({
      experiment: {
        question,
        userId: user.id,
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
        generatedAt: new Date().toISOString(),
        persistence: "No experimental coach messages were saved.",
      },
      sharedContext: {
        personalContext: context,
        personalMemories,
        conversationHistory: history,
      },
      workoutContext: {
        analysisAvailable: workoutAnalysis !== null,
        analysis: workoutAnalysis,
        intelligenceStatus: workoutIntelligence.status,
        deterministicPlan:
          workoutIntelligence.status === "ready"
            ? workoutIntelligence.plan
            : null,
      },
      comparison: {
        disabled: {
          withheld: [
            "Workout analysis",
            "Actual workout-intelligence status and history availability",
          ],
          prompt: disabledPrompt,
          output: disabledResponse,
        },
        enabled: {
          included: [
            "Actual workout analysis",
            "Actual workout-intelligence status",
          ],
          prompt: enabledPrompt,
          output: enabledResponse,
        },
      },
      planReasoning: planEvidence,
    });
  } catch (error) {
    console.error("Workout context experiment failed:", error);

    return NextResponse.json(
      {
        stage: "experiment",
        error:
          error instanceof Error
            ? error.message
            : "Unknown experiment error",
      },
      { status: 500 },
    );
  }
}