import { COACH_INSTRUCTIONS } from "./instructions";
import { COACH_RULES } from "./rules";
import type { WorkoutAnalysis } from "@/lib/workout/workout";

type WorkoutIntelligenceStatus = "ready" | "needs_baseline";

type BuildCoachPromptParams = {
  context: unknown;
  workoutAnalysis: WorkoutAnalysis | null;
  workoutIntelligenceStatus: WorkoutIntelligenceStatus;
  history: unknown[];
  question: string;
};

export function buildCoachPrompt({
  context,
  workoutAnalysis,
  workoutIntelligenceStatus,
  history,
  question,
}: BuildCoachPromptParams): string {
  return `
${COACH_INSTRUCTIONS}

${COACH_RULES}

USER CONTEXT:

${JSON.stringify(context, null, 2)}

WORKOUT INTELLIGENCE STATE:

${workoutIntelligenceStatus}

WORKOUT ANALYSIS:

${JSON.stringify(workoutAnalysis, null, 2)}

CONVERSATION HISTORY:

${JSON.stringify(history, null, 2)}

CURRENT USER QUESTION:

${question}

Use the user's context, workout intelligence state, workout analysis, and conversation history when relevant.

Treat workout analysis as factual application-generated data.

Treat workout intelligence state as factual application-generated data.

Do not invent workout data.

If workoutIntelligenceStatus is "needs_baseline", understand that the user does not yet have completed workout history available for progression analysis.

Do not claim the user completed a workout if workoutAnalysis is null.

Do not perform calculations that contradict the supplied workout analysis.

The AI may interpret the workout analysis and explain it to the user, but deterministic calculations remain the responsibility of the application.

If workoutIntelligenceStatus is "needs_baseline", do not fabricate previous workout performance or progression. If the user's question requires workout history, explain that there is not enough recorded history yet and ask for the most useful next information or action.

Think through the user's situation before answering.

Prioritize the most useful actions.

Return JSON with exactly this structure:
{
  "answer": "your answer here"
}
`;
}