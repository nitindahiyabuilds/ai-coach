import { describe, expect, it } from "vitest";
import { buildCoachPrompt } from "@/lib/ai/coach/prompt";
import type { WorkoutAnalysis } from "@/lib/workout/workout";

describe("buildCoachPrompt", () => {
  it("includes user context in the prompt", () => {
    const context = {
      profile: {
        age: 22,
        goal: "muscle_gain",
        weight_kg: 75,
      },
      healthMetrics: {
        bmr: 1800,
        tdee: 2700,
      },
    };

    const prompt = buildCoachPrompt({
      context,
      workoutAnalysis: null,
      workoutIntelligenceStatus: "needs_baseline",
      history: [],
      question: "How should I train today?",
    });

    expect(prompt).toContain('"age": 22');
    expect(prompt).toContain('"goal": "muscle_gain"');
    expect(prompt).toContain('"weight_kg": 75');
    expect(prompt).toContain('"bmr": 1800');
    expect(prompt).toContain('"tdee": 2700');
  });

  it("includes workout analysis in the prompt", () => {
    const workoutAnalysis: WorkoutAnalysis = {
      latest_session: {
        id: "session-1",
        user_id: "user-1",
        date: "2026-08-28",
        started_at: "2026-08-28T10:00:00Z",
        completed_at: "2026-08-28T11:00:00Z",
        notes: null,
        post_workout_feedback: null,
        created_at: "2026-08-28T10:00:00Z",
        workout_sets: [
          {
            id: "set-1",
            session_id: "session-1",
            exercise_name: "Bench Press",
            exercise_order: 1,
            set_number: 1,
            weight: 80,
            reps: 8,
            felt: "moderate",
            created_at: "2026-08-28T10:15:00Z",
          },
        ],
      },
      previous_session: {
        id: "session-2",
        user_id: "user-1",
        date: "2026-08-25",
        started_at: "2026-08-25T10:00:00Z",
        completed_at: "2026-08-25T11:00:00Z",
        notes: null,
        post_workout_feedback: null,
        created_at: "2026-08-25T10:00:00Z",
        workout_sets: [
          {
            id: "set-2",
            session_id: "session-2",
            exercise_name: "Bench Press",
            exercise_order: 1,
            set_number: 1,
            weight: 77.5,
            reps: 8,
            felt: "moderate",
            created_at: "2026-08-25T10:15:00Z",
          },
        ],
      },
      exercises: [
        {
          exercise_name: "Bench Press",
          latest: {
            session_date: "2026-08-28",
            sets: [
              {
                id: "set-1",
                session_id: "session-1",
                exercise_name: "Bench Press",
                exercise_order: 1,
                set_number: 1,
                weight: 80,
                reps: 8,
                felt: "moderate",
                created_at: "2026-08-28T10:15:00Z",
              },
            ],
            total_volume: 640,
            top_set: {
              id: "set-1",
              session_id: "session-1",
              exercise_name: "Bench Press",
              exercise_order: 1,
              set_number: 1,
              weight: 80,
              reps: 8,
              felt: "moderate",
              created_at: "2026-08-28T10:15:00Z",
            },
          },
          previous: {
            session_date: "2026-08-25",
            sets: [
              {
                id: "set-2",
                session_id: "session-2",
                exercise_name: "Bench Press",
                exercise_order: 1,
                set_number: 1,
                weight: 77.5,
                reps: 8,
                felt: "moderate",
                created_at: "2026-08-25T10:15:00Z",
              },
            ],
            total_volume: 620,
            top_set: {
              id: "set-2",
              session_id: "session-2",
              exercise_name: "Bench Press",
              exercise_order: 1,
              set_number: 1,
              weight: 77.5,
              reps: 8,
              felt: "moderate",
              created_at: "2026-08-25T10:15:00Z",
            },
          },
          changes: {
            top_weight: 2.5,
            top_reps: 0,
            total_volume: 20,
          },
          trend: [
            {
              session_date: "2026-08-25",
              sets: [
                {
                  id: "set-2",
                  session_id: "session-2",
                  exercise_name: "Bench Press",
                  exercise_order: 1,
                  set_number: 1,
                  weight: 77.5,
                  reps: 8,
                  felt: "moderate",
                  created_at: "2026-08-25T10:15:00Z",
                },
              ],
              total_volume: 620,
              top_set: {
                id: "set-2",
                session_id: "session-2",
                exercise_name: "Bench Press",
                exercise_order: 1,
                set_number: 1,
                weight: 77.5,
                reps: 8,
                felt: "moderate",
                created_at: "2026-08-25T10:15:00Z",
              },
            },
            {
              session_date: "2026-08-28",
              sets: [
                {
                  id: "set-1",
                  session_id: "session-1",
                  exercise_name: "Bench Press",
                  exercise_order: 1,
                  set_number: 1,
                  weight: 80,
                  reps: 8,
                  felt: "moderate",
                  created_at: "2026-08-28T10:15:00Z",
                },
              ],
              total_volume: 640,
              top_set: {
                id: "set-1",
                session_id: "session-1",
                exercise_name: "Bench Press",
                exercise_order: 1,
                set_number: 1,
                reps: 8,
                weight: 80,
                felt: "moderate",
                created_at: "2026-08-28T10:15:00Z",
              },
            },
          ],
          days_since_last_trained: 1,
        },
      ],
    };

    const prompt = buildCoachPrompt({
      context: {},
      workoutAnalysis,
      workoutIntelligenceStatus: "ready",
      history: [],
      question: "Should I increase my bench press?",
    });

    expect(prompt).toContain("Bench Press");
    expect(prompt).toContain('"weight": 80');
    expect(prompt).toContain('"reps": 8');
    expect(prompt).toContain('"days_since_last_trained": 1');
  });

  it("includes conversation history in the prompt", () => {
    const history = [
      {
        role: "user",
        content: "I want to focus on building muscle.",
        created_at: "2026-08-27T10:00:00Z",
      },
      {
        role: "assistant",
        content: "We'll prioritize progressive overload.",
        created_at: "2026-08-27T10:01:00Z",
      },
    ];

    const prompt = buildCoachPrompt({
      context: {},
      workoutAnalysis: null,
      workoutIntelligenceStatus: "needs_baseline",
      history,
      question: "What should I do today?",
    });

    expect(prompt).toContain(
      "I want to focus on building muscle.",
    );

    expect(prompt).toContain(
      "We'll prioritize progressive overload.",
    );
  });

  it("includes the current user question", () => {
    const question =
      "Should I increase my squat weight this week?";

    const prompt = buildCoachPrompt({
      context: {},
      workoutAnalysis: null,
      workoutIntelligenceStatus: "needs_baseline",
      history: [],
      question,
    });

    expect(prompt).toContain(question);
  });

  it("treats workout analysis as authoritative application data", () => {
    const emptySession = {
      id: "session-empty",
      user_id: "user-1",
      date: "2026-08-28",
      started_at: null,
      completed_at: null,
      notes: null,
      post_workout_feedback: null,
      created_at: "2026-08-28T10:00:00Z",
      workout_sets: [],
    };

    const prompt = buildCoachPrompt({
      context: {},
      workoutAnalysis: {
        latest_session: emptySession,
        previous_session: null,
        exercises: [],
      },
      workoutIntelligenceStatus: "ready",
      history: [],
      question: "What should I do?",
    });

    expect(prompt).toContain(
      "Treat workout analysis as factual application-generated data.",
    );

    expect(prompt).toContain(
      "Do not invent workout data.",
    );

    expect(prompt).toContain(
      "Do not perform calculations that contradict the supplied workout analysis.",
    );

    expect(prompt).toContain(
      "The AI may interpret the workout analysis and explain it to the user, but deterministic calculations remain the responsibility of the application.",
    );
  });

  it("handles missing workout analysis explicitly", () => {
    const prompt = buildCoachPrompt({
      context: {},
      workoutAnalysis: null,
      workoutIntelligenceStatus: "needs_baseline",
      history: [],
      question: "How did my workout go?",
    });

    expect(prompt).toContain(
      "Do not claim the user completed a workout if workoutAnalysis is null.",
    );

    expect(prompt).toContain(
      "WORKOUT ANALYSIS:",
    );

    expect(prompt).toContain("null");
  });

  it("includes workout intelligence state", () => {
    const prompt = buildCoachPrompt({
      context: {},
      workoutAnalysis: null,
      workoutIntelligenceStatus: "needs_baseline",
      history: [],
      question: "What should I do today?",
    });

    expect(prompt).toContain(
      "WORKOUT INTELLIGENCE STATE:",
    );

    expect(prompt).toContain(
      "needs_baseline",
    );

    expect(prompt).toContain(
      'If workoutIntelligenceStatus is "needs_baseline"',
    );
  });

  it("includes the adaptive coaching decision process", () => {
    const prompt = buildCoachPrompt({
      context: {},
      workoutAnalysis: null,
      workoutIntelligenceStatus: "needs_baseline",
      history: [],
      question: "I want to start working out.",
    });

    expect(prompt).toContain(
      "Before answering, determine whether you have enough relevant information to give a genuinely useful and personalized answer.",
    );

    expect(prompt).toContain(
      "IDENTIFY DECISION-CRITICAL GAPS",
    );

    expect(prompt).toContain(
      "If important decision-critical information is missing:",
    );

    expect(prompt).toContain(
      "Ask only for the highest-value missing piece of information.",
    );
  });

  it("prevents unnecessary and repetitive follow-up questions", () => {
    const prompt = buildCoachPrompt({
      context: {
        profile: {
          age: 22,
          goal: "muscle_gain",
          equipment: "home gym",
        },
      },
      workoutAnalysis: null,
      workoutIntelligenceStatus: "needs_baseline",
      history: [
        {
          role: "user",
          content: "I train at home.",
        },
      ],
      question: "What should I do today?",
    });

    expect(prompt).toContain(
      "Do not ask for information that is already available in:",
    );

    expect(prompt).toContain(
      "Do not ask a question merely to make the conversation feel more conversational.",
    );

    expect(prompt).toContain(
      "Ask one question at a time.",
    );
  });

  it("requires learning before prescribing when personalization inputs are missing", () => {
    const prompt = buildCoachPrompt({
      context: {},
      workoutAnalysis: null,
      workoutIntelligenceStatus: "needs_baseline",
      history: [],
      question: "Build me a workout plan.",
    });

    expect(prompt).toContain(
      "LEARN BEFORE PRESCRIBING",
    );

    expect(prompt).toContain(
      "do not immediately prescribe a detailed solution",
    );

    expect(prompt).toContain(
      "First collect the smallest amount of information necessary",
    );
  });

  it("allows the coach to answer when missing information is not decision-critical", () => {
    const prompt = buildCoachPrompt({
      context: {},
      workoutAnalysis: null,
      workoutIntelligenceStatus: "needs_baseline",
      history: [],
      question: "What is progressive overload?",
    });

    expect(prompt).toContain(
      "If some information is missing but does not materially affect the current answer, proceed with the best useful answer you can give.",
    );

    expect(prompt).toContain(
      "If the available context is sufficient:",
    );

    expect(prompt).toContain(
      "Do not ask unnecessary follow-up questions.",
    );
  });

  it("prioritizes current explicit user information over retrieved memory", () => {
    const prompt = buildCoachPrompt({
      context: {},
      personalMemories: [
        {
          id: "memory-1",
          user_id: "user-1",
          fact: "Prefers evening workouts",
          category: "preference",
          source: "user",
          evidence: "confirmed",
          status: "active",
          created_at: "2026-10-03T10:00:00Z",
          updated_at: "2026-10-03T10:00:00Z",
          supersedes_id: null,
          similarity: 0.92,
        },
      ],
      workoutAnalysis: null,
      workoutIntelligenceStatus: "needs_baseline",
      history: [],
      question: "I actually prefer morning workouts now.",
    });

    expect(prompt).toContain(
      "If the current message updates or contradicts previously retrieved memory or conversation context, use the current explicit statement.",
    );
  });
});