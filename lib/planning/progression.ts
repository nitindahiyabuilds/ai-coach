import type { ExerciseAnalysis } from "@/lib/workout/workout";

export type ProgressionDecision =
  | "progress"
  | "hold"
  | "deload";

export type WorkoutRecommendation = {
  exercise_name: string;
  decision: ProgressionDecision;

  sets: number;
  reps: number;
  weight: number;

  reason_code:
    | "progressed"
    | "maintain_after_decline"
    | "deload_after_repeated_decline"
    | "recent_return"
    | "insufficient_history";

  days_since_last_trained: number;
};

const STANDARD_WEIGHT_INCREMENT = 2.5;

const DEFAULT_SETS = 2;

const DEFAULT_REPS = 8;

const DELOAD_PERCENTAGE = 0.9;

const LONG_BREAK_DAYS = 21;

function roundWeight(weight: number): number {
  return Math.round(weight * 2) / 2;
}

function getPreviousTopSetWeight(
  exercise: ExerciseAnalysis
): number | null {
  return exercise.previous?.top_set?.weight ?? null;
}

function getPreviousTopSetReps(
  exercise: ExerciseAnalysis
): number | null {
  return exercise.previous?.top_set?.reps ?? null;
}

function hasRepeatedRepDecline(
  exercise: ExerciseAnalysis
): boolean {
  if (exercise.trend.length < 3) {
    return false;
  }

  const latest = exercise.trend[0];
  const previous = exercise.trend[1];
  const older = exercise.trend[2];

  if (
    !latest.top_set ||
    !previous.top_set ||
    !older.top_set
  ) {
    return false;
  }

  const latestRepDeclined =
    latest.top_set.reps < previous.top_set.reps;

  const previousRepDeclined =
    previous.top_set.reps < older.top_set.reps;

  return latestRepDeclined && previousRepDeclined;
}

function hasInsufficientHistory(
  exercise: ExerciseAnalysis
): boolean {
  return exercise.trend.length < 2;
}

function getBaseWeight(
  exercise: ExerciseAnalysis
): number {
  return (
    exercise.latest.top_set?.weight ??
    getPreviousTopSetWeight(exercise) ??
    0
  );
}

function getBaseReps(
  exercise: ExerciseAnalysis
): number {
  return (
    exercise.latest.top_set?.reps ??
    getPreviousTopSetReps(exercise) ??
    DEFAULT_REPS
  );
}

export function generateWorkoutRecommendation(
  exercise: ExerciseAnalysis
): WorkoutRecommendation {
  const baseWeight = getBaseWeight(exercise);

  const baseReps = getBaseReps(exercise);

  /*
   * No useful history means we should not
   * make an aggressive progression decision.
   */
  if (hasInsufficientHistory(exercise)) {
    return {
      exercise_name: exercise.exercise_name,
      decision: "hold",
      sets: DEFAULT_SETS,
      reps: baseReps,
      weight: roundWeight(baseWeight),
      reason_code: "insufficient_history",
      days_since_last_trained:
        exercise.days_since_last_trained,
    };
  }

  /*
   * A long break means we should not immediately
   * continue progressive overload.
   *
   * Back off approximately 10% and rebuild.
   */
  if (
    exercise.days_since_last_trained >=
    LONG_BREAK_DAYS
  ) {
    return {
      exercise_name: exercise.exercise_name,
      decision: "deload",
      sets: DEFAULT_SETS,
      reps: baseReps,
      weight: roundWeight(
        baseWeight * DELOAD_PERCENTAGE
      ),
      reason_code: "recent_return",
      days_since_last_trained:
        exercise.days_since_last_trained,
    };
  }

  /*
   * Two consecutive declines across the
   * three-session trend indicate a pattern
   * rather than a single bad session.
   */
  if (hasRepeatedRepDecline(exercise)) {
    return {
      exercise_name: exercise.exercise_name,
      decision: "deload",
      sets: DEFAULT_SETS,
      reps: baseReps,
      weight: roundWeight(
        baseWeight * DELOAD_PERCENTAGE
      ),
      reason_code: "deload_after_repeated_decline",
      days_since_last_trained:
        exercise.days_since_last_trained,
    };
  }

  /*
   * If the latest top-set reps did not decline,
   * progress by the standard increment.
   */
  const latestReps =
    exercise.latest.top_set?.reps ?? 0;

  const previousReps =
    exercise.previous?.top_set?.reps ?? 0;

  if (latestReps >= previousReps) {
    return {
      exercise_name: exercise.exercise_name,
      decision: "progress",
      sets: DEFAULT_SETS,
      reps: DEFAULT_REPS,
      weight: roundWeight(
        baseWeight + STANDARD_WEIGHT_INCREMENT
      ),
      reason_code: "progressed",
      days_since_last_trained:
        exercise.days_since_last_trained,
    };
  }

  /*
   * A single decline means hold the current load.
   * We do not overreact to one bad session.
   */
  return {
    exercise_name: exercise.exercise_name,
    decision: "hold",
    sets: DEFAULT_SETS,
    reps: baseReps,
    weight: roundWeight(baseWeight),
    reason_code: "maintain_after_decline",
    days_since_last_trained:
      exercise.days_since_last_trained,
  };
}

export function generateWorkoutRecommendations(
  exercises: ExerciseAnalysis[]
): WorkoutRecommendation[] {
  return exercises.map(
    generateWorkoutRecommendation
  );
}