import { COACH_INSTRUCTIONS } from "./instructions";
import { COACH_RULES } from "./rules";
import type { WorkoutAnalysis } from "@/lib/analysis/workout";

type BuildCoachPromptParams = {
  context: unknown;
  workoutAnalysis: WorkoutAnalysis | null;
  history: unknown[];
  question: string;
};

export function buildCoachPrompt({
  context,
  workoutAnalysis,
  history,
  question,
}: BuildCoachPromptParams): string {
  return `
${COACH_INSTRUCTIONS}

${COACH_RULES}

USER CONTEXT:

${JSON.stringify(context, null, 2)}

WORKOUT ANALYSIS:

${JSON.stringify(workoutAnalysis, null, 2)}

CONVERSATION HISTORY:

${JSON.stringify(history, null, 2)}

CURRENT USER QUESTION:

${question}

Use the user's context, workout analysis, and conversation history when relevant.

Treat workout analysis as factual application-generated data.

Do not invent workout data.

Do not claim the user completed a workout if workoutAnalysis is null.

Do not perform calculations that contradict the supplied workout analysis.

The AI may interpret the workout analysis and explain it to the user, but deterministic calculations remain the responsibility of the application.

Think through the user's situation before answering.

Prioritize the most useful actions.

Return JSON with exactly this structure:

{
  "answer": "your answer here"
}
`;
}