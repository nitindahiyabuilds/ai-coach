import { describe, expect, it } from "vitest";
import {
  generateWorkoutRecommendation,
  type WorkoutRecommendation,
} from "@/lib/planning/progression";
import type {
  ExerciseAnalysis,
  ExerciseSessionAnalysis,
  WorkoutSet,
} from "@/lib/workout/workout";

function createSet(
  overrides: Partial<WorkoutSet> = {}
): WorkoutSet {
  return {
    id: crypto.randomUUID(),
    session_id: "session-1",
    exercise_name: "Bench Press",
    exercise_order: 1,
    set_number: 1,
    weight: 80,
    reps: 8,
    felt: "moderate",
    created_at: "2026-08-20T10:00:00Z",
    ...overrides,
  };
}

function createExerciseSession(
  date: string,
  weight: number,
  reps: number
): ExerciseSessionAnalysis {
  const set = createSet({
    weight,
    reps,
  });

  return {
    session_date: date,
    sets: [set],
    total_volume: weight * reps,
    top_set: set,
  };
}

function createExerciseAnalysis(
  trend: ExerciseSessionAnalysis[],
  daysSinceLastTrained = 3
): ExerciseAnalysis {
  return {
    exercise_name: "Bench Press",
    latest: trend[0],
    previous: trend[1] ?? null,
    trend,
    days_since_last_trained: daysSinceLastTrained,
    changes: {
      top_weight:
        trend.length >= 2
          ? trend[0].top_set!.weight -
            trend[1].top_set!.weight
          : null,
      top_reps:
        trend.length >= 2
          ? trend[0].top_set!.reps -
            trend[1].top_set!.reps
          : null,
      total_volume:
        trend.length >= 2
          ? trend[0].total_volume -
            trend[1].total_volume
          : null,
    },
  };
}

describe("generateWorkoutRecommendation", () => {
  it("recommends progression when latest performance does not decline", () => {
    const latest = createExerciseSession(
      "2026-08-20",
      80,
      8
    );

    const previous = createExerciseSession(
      "2026-08-17",
      77.5,
      8
    );

    const exercise = createExerciseAnalysis([
      latest,
      previous,
    ]);

    const recommendation =
      generateWorkoutRecommendation(exercise);

    expect(recommendation.decision).toBe("progress");
    expect(recommendation.reason_code).toBe("progressed");
    expect(recommendation.weight).toBe(82.5);
    expect(recommendation.reps).toBe(8);
    expect(recommendation.sets).toBe(2);
  });

  it("holds the current load after a single performance decline", () => {
    const latest = createExerciseSession(
      "2026-08-20",
      80,
      7
    );

    const previous = createExerciseSession(
      "2026-08-17",
      80,
      8
    );

    const exercise = createExerciseAnalysis([
      latest,
      previous,
    ]);

    const recommendation =
      generateWorkoutRecommendation(exercise);

    expect(recommendation.decision).toBe("hold");
    expect(recommendation.reason_code).toBe(
      "maintain_after_decline"
    );
    expect(recommendation.weight).toBe(80);
    expect(recommendation.reps).toBe(7);
  });

  it("recommends a deload after repeated performance decline", () => {
    const latest = createExerciseSession(
      "2026-08-20",
      80,
      6
    );

    const previous = createExerciseSession(
      "2026-08-17",
      80,
      7
    );

    const older = createExerciseSession(
      "2026-08-14",
      80,
      8
    );

    const exercise = createExerciseAnalysis([
      latest,
      previous,
      older,
    ]);

    const recommendation =
      generateWorkoutRecommendation(exercise);

    expect(recommendation.decision).toBe("deload");
    expect(recommendation.reason_code).toBe(
      "deload_after_repeated_decline"
    );
    expect(recommendation.weight).toBe(72);
    expect(recommendation.reps).toBe(6);
  });

  it("holds when there is insufficient workout history", () => {
    const latest = createExerciseSession(
      "2026-08-20",
      80,
      8
    );

    const exercise = createExerciseAnalysis([
      latest,
    ]);

    const recommendation =
      generateWorkoutRecommendation(exercise);

    expect(recommendation.decision).toBe("hold");
    expect(recommendation.reason_code).toBe(
      "insufficient_history"
    );
    expect(recommendation.weight).toBe(80);
    expect(recommendation.reps).toBe(8);
  });

  it("recommends a deload after a long break", () => {
    const latest = createExerciseSession(
      "2026-08-20",
      80,
      8
    );

    const previous = createExerciseSession(
      "2026-07-20",
      80,
      8
    );

    const exercise = createExerciseAnalysis(
      [latest, previous],
      21
    );

    const recommendation =
      generateWorkoutRecommendation(exercise);

    expect(recommendation.decision).toBe("deload");
    expect(recommendation.reason_code).toBe(
      "recent_return"
    );
    expect(recommendation.weight).toBe(72);
    expect(
      recommendation.days_since_last_trained
    ).toBe(21);
  });

  it("uses the three-session trend to distinguish a single decline from repeated decline", () => {
    const latest = createExerciseSession(
      "2026-08-20",
      80,
      7
    );

    const previous = createExerciseSession(
      "2026-08-17",
      80,
      6
    );

    const older = createExerciseSession(
      "2026-08-14",
      80,
      7
    );

    const exercise = createExerciseAnalysis([
      latest,
      previous,
      older,
    ]);

    const recommendation =
      generateWorkoutRecommendation(exercise);

    expect(recommendation.decision).toBe("progress");
    expect(recommendation.reason_code).toBe("progressed");
  });

  it("preserves the exercise identity and recency in the recommendation", () => {
    const latest = createExerciseSession(
      "2026-08-20",
      80,
      8
    );

    const previous = createExerciseSession(
      "2026-08-17",
      77.5,
      8
    );

    const exercise = createExerciseAnalysis(
      [latest, previous],
      3
    );

    const recommendation =
      generateWorkoutRecommendation(exercise);

    expect(recommendation.exercise_name).toBe(
      "Bench Press"
    );
    expect(
      recommendation.days_since_last_trained
    ).toBe(3);
  });
});