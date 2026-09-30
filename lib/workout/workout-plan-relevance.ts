const WORKOUT_TERMS = [
  "workout",
  "workouts",
  "exercise",
  "exercises",
  "training",
  "gym",
  "lift",
  "lifting",
  "strength",
  "squat",
  "squats",
  "bench",
  "deadlift",
  "deadlifts",
  "row",
  "rows",
  "press",
  "presses",
  "curl",
  "curls",
  "push",
  "pull",
  "legs",
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
];

const PLAN_INTENT_TERMS = [
  "plan",
  "routine",
  "program",
  "exercise",
  "exercises",
  "workout",
  "workouts",
  "training",
  "progress",
  "progression",
  "increase",
  "decrease",
  "raise",
  "lower",
  "weight",
  "reps",
  "sets",
  "load",
  "recommend",
  "recommendation",
  "recommendations",
  "should i",
  "what should i",
  "what can i",
];

const HISTORY_INTENT_TERMS = [
  "what did i do",
  "what did i",
  "last workout",
  "previous workout",
  "previous session",
  "last session",
  "history",
  "historical",
];

function containsTerm(question: string, terms: string[]): boolean {
  return terms.some((term) => question.includes(term));
}

export function isWorkoutPlanRelevant(question: string): boolean {
  const normalizedQuestion = question.trim().toLowerCase();

  if (!normalizedQuestion) {
    return false;
  }

  if (containsTerm(normalizedQuestion, HISTORY_INTENT_TERMS)) {
    return false;
  }

  const mentionsWorkout = containsTerm(normalizedQuestion, WORKOUT_TERMS);
  const expressesPlanIntent = containsTerm(
    normalizedQuestion,
    PLAN_INTENT_TERMS
  );

  const mentionsPlanSpecificMetric = containsTerm(normalizedQuestion, [
    "weight",
    "reps",
    "sets",
    "load",
  ]);

  if (mentionsPlanSpecificMetric) {
    return true;
  }

  return mentionsWorkout && expressesPlanIntent;
}