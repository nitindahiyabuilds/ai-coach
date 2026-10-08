import { describe, expect, it } from "vitest";
import { buildCoachPrompt } from "@/lib/ai/coach/prompt";
import { buildWorkoutPlanPrompt } from "@/lib/ai/coach/workout-plan-prompt";

const deterministicPlan = {
  exercises: [
    {
      exerciseName: "Bench Press",
      sets: 3,
      reps: 8,
      weight: 82.5,
      decision: "progress" as const,
      reasonCode: "progressed" as const,
      daysSinceLastTrained: 3,
    },
  ],
};

describe("Lifestyle OS AI evaluation suite", () => {
  describe("adaptive coaching behavior", () => {
    it("requires the coach to identify decision-critical missing context", () => {
      const prompt = buildCoachPrompt({
        context: {},
        personalMemories: [],
        workoutAnalysis: null,
        workoutIntelligenceStatus: "needs_baseline",
        history: [],
        question: "Build me a personalized workout plan.",
      });

      expect(prompt).toContain(
        "IDENTIFY DECISION-CRITICAL GAPS",
      );

      expect(prompt).toContain(
        "If important decision-critical information is missing:",
      );

      expect(prompt).toContain(
        "Ask only for the highest-value missing piece of information.",
      );

      expect(prompt).toContain(
        "Ask one question at a time.",
      );
    });

    it("prevents the coach from turning personalization into a questionnaire", () => {
      const prompt = buildCoachPrompt({
        context: {},
        personalMemories: [],
        workoutAnalysis: null,
        workoutIntelligenceStatus: "needs_baseline",
        history: [],
        question: "Help me start training.",
      });

      expect(prompt).toContain(
        "Do not turn the conversation into a questionnaire.",
      );

      expect(prompt).toContain(
        "DO NOT OVER-QUESTION",
      );
    });

    it("requires the coach to use information already available", () => {
      const prompt = buildCoachPrompt({
        context: {
          profile: {
            age: 22,
            goal: "muscle_gain",
            equipment: "home gym",
          },
        },
        personalMemories: [],
        workoutAnalysis: null,
        workoutIntelligenceStatus: "needs_baseline",
        history: [
          {
            role: "user",
            content: "I train at home with dumbbells.",
            created_at: "2026-10-01T10:00:00Z",
          },
        ],
        question: "What should I train today?",
      });

      expect(prompt).toContain(
        "Do not ask for information that is already available in:",
      );

      expect(prompt).toContain(
        "user context",
      );

      expect(prompt).toContain(
        "conversation history",
      );
    });

    it("prioritizes the current user message over previous context", () => {
      const prompt = buildCoachPrompt({
        context: {
          profile: {
            age: 22,
            goal: "muscle_gain",
          },
        },
        personalMemories: [
          {
            id: "memory-1",
            user_id: "user-1",
            fact: "User wants to focus on muscle gain.",
            category: "goal",
            source: "user",
            evidence: "confirmed",
            status: "active",
            created_at: "2026-09-01T10:00:00Z",
            updated_at: "2026-09-01T10:00:00Z",
            supersedes_id: null,
            similarity: 0.91,
          },
        ],
        workoutAnalysis: null,
        workoutIntelligenceStatus: "needs_baseline",
        history: [],
        question:
          "My goal has changed. I now want to focus on endurance.",
      });

      expect(prompt).toContain(
        "Treat explicit information in the current user question as the highest-priority user-provided information.",
      );

      expect(prompt).toContain(
        "If the current message updates or contradicts previously retrieved memory or conversation context, use the current explicit statement.",
      );
    });
  });

  describe("personal memory behavior", () => {
    it("prevents inferred memory from being treated as confirmed", () => {
      const prompt = buildCoachPrompt({
        context: {},
        personalMemories: [
          {
            id: "memory-1",
            user_id: "user-1",
            fact: "User probably prefers evening workouts.",
            category: "preference",
            source: "inference",
            evidence: "inferred",
            status: "active",
            created_at: "2026-10-01T10:00:00Z",
            updated_at: "2026-10-01T10:00:00Z",
            supersedes_id: null,
            similarity: 0.84,
          },
        ],
        workoutAnalysis: null,
        workoutIntelligenceStatus: "needs_baseline",
        history: [],
        question: "When should I train?",
      });

      expect(prompt).toContain(
        "Do not treat inferred personal memory as confirmed fact.",
      );

      expect(prompt).toContain(
        "Do not claim that a retrieved memory is current if its status or evidence indicates otherwise.",
      );
    });

    it("requires the coach to respect memory lifecycle state", () => {
      const prompt = buildCoachPrompt({
        context: {},
        personalMemories: [
          {
            id: "memory-1",
            user_id: "user-1",
            fact: "User prefers morning workouts.",
            category: "preference",
            source: "user",
            evidence: "confirmed",
            status: "superseded",
            created_at: "2026-09-01T10:00:00Z",
            updated_at: "2026-10-01T10:00:00Z",
            supersedes_id: "memory-2",
            similarity: 0.9,
          },
        ],
        workoutAnalysis: null,
        workoutIntelligenceStatus: "needs_baseline",
        history: [],
        question: "When should I train?",
      });

      expect(prompt).toContain(
        "Do not claim that a retrieved memory is current if its status or evidence indicates otherwise.",
      );
    });
  });

  describe("workout intelligence behavior", () => {
    it("prevents fabricated workout history when baseline is unavailable", () => {
      const prompt = buildCoachPrompt({
        context: {},
        personalMemories: [],
        workoutAnalysis: null,
        workoutIntelligenceStatus: "needs_baseline",
        history: [],
        question:
          "How much weight should I add to my bench press?",
      });

      expect(prompt).toContain(
        'If workoutIntelligenceStatus is "needs_baseline"',
      );

      expect(prompt).toContain(
        "do not fabricate previous workout performance or progression",
      );

      expect(prompt).toContain(
        "there is not enough recorded history yet",
      );
    });

    it("treats workout analysis as application-generated factual data", () => {
      const prompt = buildCoachPrompt({
        context: {},
        personalMemories: [],
        workoutAnalysis: {
          latest_session: {
            id: "session-1",
            user_id: "user-1",
            date: "2026-10-01",
            started_at: "2026-10-01T10:00:00Z",
            completed_at: "2026-10-01T11:00:00Z",
            notes: null,
            post_workout_feedback: null,
            created_at: "2026-10-01T10:00:00Z",
            workout_sets: [],
          },
          previous_session: null,
          exercises: [],
        },
        workoutIntelligenceStatus: "ready",
        history: [],
        question: "How did my workout go?",
      });

      expect(prompt).toContain(
        "Treat workout analysis as factual application-generated data.",
      );

      expect(prompt).toContain(
        "Do not invent workout data.",
      );

      expect(prompt).toContain(
        "deterministic calculations remain the responsibility of the application.",
      );
    });
  });

  describe("deterministic workout plan boundary", () => {
    it("makes deterministic workout fields authoritative", () => {
      const prompt = buildWorkoutPlanPrompt({
        plan: deterministicPlan,
      });

      expect(prompt).toContain(
        "The exercise name, sets, reps, weight, and decision are authoritative.",
      );

      expect(prompt).toContain(
        "DO NOT change them.",
      );

      expect(prompt).toContain(
        "DO NOT invent different weights, reps, or sets.",
      );

      expect(prompt).toContain(
        "DO NOT make progression decisions.",
      );
    });

    it("limits the workout reasoning model to explanation", () => {
      const prompt = buildWorkoutPlanPrompt({
        plan: deterministicPlan,
      });

      expect(prompt).toContain(
        "Your only job is to explain why each deterministic recommendation makes sense.",
      );

      expect(prompt).toContain(
        "Return one reasoning object for every exercise in the deterministic plan.",
      );
    });

    it("does not give the reasoning model authority over workout history", () => {
      const prompt = buildWorkoutPlanPrompt({
        plan: deterministicPlan,
      });

      expect(prompt).toContain(
        "Do not invent workout history that is not present in the plan.",
      );
    });
  });

  describe("evaluation suite integrity", () => {
    it("keeps the coach response contract JSON-only", () => {
      const prompt = buildCoachPrompt({
        context: {},
        personalMemories: [],
        workoutAnalysis: null,
        workoutIntelligenceStatus: "needs_baseline",
        history: [],
        question: "What should I do today?",
      });

      expect(prompt).toContain(
        "Return JSON with exactly this structure:",
      );

      expect(prompt).toContain(
        '"answer": "your answer here"',
      );
    });

    it("keeps workout reasoning output constrained to the expected structure", () => {
      const prompt = buildWorkoutPlanPrompt({
        plan: deterministicPlan,
      });

      expect(prompt).toContain(
        '"exercises": [',
      );

      expect(prompt).toContain(
        '"exerciseName": "exact exercise name from the plan"',
      );

      expect(prompt).toContain(
        '"reasoning": "short explanation of the recommendation"',
      );
    });
  });
});