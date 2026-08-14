import { COACH_INSTRUCTIONS } from "./instructions";
import { COACH_RULES } from "./rules";

type BuildCoachPromptParams = {
  context: unknown;
  history: unknown[];
  question: string;
};

export function buildCoachPrompt({
  context,
  history,
  question,
}: BuildCoachPromptParams): string {
  return `
${COACH_INSTRUCTIONS}

${COACH_RULES}

USER CONTEXT:

${JSON.stringify(context, null, 2)}

CONVERSATION HISTORY:

${JSON.stringify(history, null, 2)}

CURRENT USER QUESTION:

${question}

Use the user's context and conversation history when relevant.

Think through the user's situation before answering.

Prioritize the most useful actions.

Return JSON with exactly this structure:

{
  "answer": "your answer here"
}
`;
}