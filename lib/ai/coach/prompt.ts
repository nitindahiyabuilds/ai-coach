import { COACH_INSTRUCTIONS } from "./instructions";

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

USER CONTEXT:

${JSON.stringify(context, null, 2)}

CONVERSATION HISTORY:

${JSON.stringify(history, null, 2)}

CURRENT USER QUESTION:

${question}

Answer the current question using the available context and conversation history.

Return JSON with exactly this structure:

{
  "answer": "your answer here"
}
`;
}