import { describe, expect, it } from "vitest";
import {
  generateWorkoutRecommendation,
  generateWorkoutRecommendations,
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
    created_at: `${date}T10:00:00Z`,
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

const representativeScenarios = {
  progress: {
    expectedDecision: "progress",
    expectedReasonCode: "progressed",
    exercise: createExerciseAnalysis([
      createExerciseSession("2026-08-20", 80, 8),
      createExerciseSession("2026-08-17", 77.5, 8),
    ]),
  },
  singleDecline: {
    expectedDecision: "hold",
    expectedReasonCode: "maintain_after_decline",
    exercise: createExerciseAnalysis([
      createExerciseSession("2026-08-20", 80, 7),
      createExerciseSession("2026-08-17", 80, 8),
    ]),
  },
  repeatedDecline: {
    expectedDecision: "deload",
    expectedReasonCode: "deload_after_repeated_decline",
    exercise: createExerciseAnalysis([
      createExerciseSession("2026-08-20", 80, 6),
      createExerciseSession("2026-08-17", 80, 7),
      createExerciseSession("2026-08-14", 80, 8),
    ]),
  },
  longBreak: {
    expectedDecision: "deload",
    expectedReasonCode: "recent_return",
    exercise: createExerciseAnalysis(
      [
        createExerciseSession("2026-08-20", 80, 8),
        createExerciseSession("2026-07-20", 80, 8),
      ],
      21
    ),
  },
  insufficientHistory: {
    expectedDecision: "hold",
    expectedReasonCode: "insufficient_history",
    exercise: createExerciseAnalysis([
      createExerciseSession("2026-08-20", 80, 8),
    ]),
  },
} as const;

describe("workout intelligence evaluation contract", () => {
  it("applies the expected progression decision and reason code for representative scenarios", () => {
    for (const scenario of Object.values(representativeScenarios)) {
      const recommendation = generateWorkoutRecommendation(scenario.exercise);

      expect(recommendation.decision).toBe(scenario.expectedDecision);
      expect(recommendation.reason_code).toBe(scenario.expectedReasonCode);
    }
  });

  it("keeps recommendation shape consistent across representative decisions", () => {
    const recommendations = generateWorkoutRecommendations(
      Object.values(representativeScenarios).map(
        (scenario) => scenario.exercise
      )
    );

    for (const recommendation of recommendations) {
      expect(recommendation.exercise_name).toBeTruthy();
      expect([
        "progress",
        "hold",
        "deload",
      ]).toContain(recommendation.decision);
      expect(recommendation.sets).toBeGreaterThan(0);
      expect(recommendation.reps).toBeGreaterThan(0);
      expect(recommendation.weight).toBeGreaterThanOrEqual(0);
      expect(
        recommendation.days_since_last_trained
      ).toBeGreaterThanOrEqual(0);
    }
  });

  it("requires a compatible reason code for each decision", () => {
    const recommendations = generateWorkoutRecommendations(
      Object.values(representativeScenarios).map(
        (scenario) => scenario.exercise
      )
    );

    const validReasonCodeMap = {
      progressed: "progress",
      maintain_after_decline: "hold",
      deload_after_repeated_decline: "deload",
      recent_return: "deload",
      insufficient_history: "hold",
    } as const;

    for (const recommendation of recommendations) {
      const expectedDecision = validReasonCodeMap[recommendation.reason_code];
      expect(expectedDecision).toBe(recommendation.decision);
    }
  });
});
