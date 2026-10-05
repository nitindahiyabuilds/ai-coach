import {
  generateCoachResponse,
  generateWorkoutPlanReasoning,
} from "@/lib/ai/client";
import { buildCoachPrompt } from "@/lib/ai/coach/prompt";
import { buildWorkoutPlanPrompt } from "@/lib/ai/coach/workout-plan-prompt";
import { getCoachMessages, saveCoachMessage } from "@/lib/memory/coach";
import { buildPersonalContext } from "@/lib/memory/context";
import { retrievePersonalMemoryFacts } from "@/lib/memory/retrieval";
import { getWorkoutAnalysis } from "@/lib/workout/workout-service";
import { buildWorkoutIntelligence } from "@/lib/workout/workout-intelligence";
import { isWorkoutPlanRelevant } from "@/lib/workout/workout-plan-relevance";
import type { CoachResponse } from "@/lib/contracts/coach";
import type { PersonalMemorySearchResult } from "@/lib/contracts/personal-memory-retrieval";
import type { WorkoutPlan } from "@/lib/contracts/workout";

export async function generateCoachResponseForUser(
  question: string,
): Promise<CoachResponse> {
  const context = await buildPersonalContext();

  let personalMemories: PersonalMemorySearchResult[] = [];

  try {
    personalMemories =
      await retrievePersonalMemoryFacts(question);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Unauthorized"
    ) {
      throw error;
    }

    console.error(
      "Failed to retrieve personal memory:",
      error,
    );
  }

  const workoutAnalysis = await getWorkoutAnalysis();

  const workoutIntelligence =
    buildWorkoutIntelligence(workoutAnalysis);

  const history = await getCoachMessages(20);

  const prompt = buildCoachPrompt({
    context,
    personalMemories,
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
          workoutPlanPrompt,
        );

      workoutPlan = {
        exercises: deterministicPlan.exercises.map(
          (exercise) => {
            const matchingReasoning =
              reasoning.exercises.find(
                (item) =>
                  item.exerciseName ===
                  exercise.exerciseName,
              );

            return {
              ...exercise,
              reasoning:
                matchingReasoning?.reasoning ??
                "Recommendation generated from your workout history.",
            };
          },
        ),
      };
    }
  }

  try {
    await saveCoachMessage("user", question);
    await saveCoachMessage(
      "assistant",
      response.answer,
    );
  } catch (error) {
    console.error(
      "Failed to persist coach messages:",
      error,
    );
  }

  return {
    success: true,
    answer: response.answer,
    workoutPlan,
  };
}
