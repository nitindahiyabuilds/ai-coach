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
                weight: 80,
                reps: 8,
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
      history,
      question: "What should I do today?",
    });

    expect(prompt).toContain(
      "I want to focus on building muscle."
    );
    expect(prompt).toContain(
      "We'll prioritize progressive overload."
    );
  });

  it("includes the current user question", () => {
    const question =
      "Should I increase my squat weight this week?";

    const prompt = buildCoachPrompt({
      context: {},
      workoutAnalysis: null,
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
      history: [],
      question: "What should I do?",
    });

    expect(prompt).toContain(
      "Treat workout analysis as factual application-generated data."
    );

    expect(prompt).toContain(
      "Do not invent workout data."
    );

    expect(prompt).toContain(
      "Do not perform calculations that contradict the supplied workout analysis."
    );

    expect(prompt).toContain(
      "The AI may interpret the workout analysis and explain it to the user, but deterministic calculations remain the responsibility of the application."
    );
  });

  it("handles missing workout analysis explicitly", () => {
    const prompt = buildCoachPrompt({
      context: {},
      workoutAnalysis: null,
      history: [],
      question: "How did my workout go?",
    });

    expect(prompt).toContain(
      "Do not claim the user completed a workout if workoutAnalysis is null."
    );

    expect(prompt).toContain(
      "WORKOUT ANALYSIS:"
    );

    expect(prompt).toContain("null");
  });
});