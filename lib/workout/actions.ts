"use server";

import { getCurrentUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

export type CreateWorkoutSessionInput = {
  date?: string;
  started_at?: string;
  notes?: string;
};

export type CreateWorkoutSetInput = {
  session_id: string;
  exercise_name: string;
  exercise_order: number;
  set_number: number;
  weight: number;
  reps: number;
  felt?: "easy" | "moderate" | "hard" | null;
};

export type UpdateWorkoutSetInput = {
  set_id: string;
  exercise_name: string;
  exercise_order: number;
  set_number: number;
  weight: number;
  reps: number;
  felt?: "easy" | "moderate" | "hard" | null;
};

function validateWorkoutSetInput(input: {
  exercise_name: string;
  exercise_order: number;
  set_number: number;
  weight: number;
  reps: number;
  felt?: "easy" | "moderate" | "hard" | null;
}) {
  if (!input.exercise_name.trim()) {
    throw new Error("Exercise name is required");
  }

  if (
    !Number.isInteger(input.exercise_order) ||
    input.exercise_order < 1
  ) {
    throw new Error("Exercise order must be a positive integer");
  }

  if (!Number.isInteger(input.set_number) || input.set_number < 1) {
    throw new Error("Set number must be a positive integer");
  }

  if (!Number.isFinite(input.weight) || input.weight < 0) {
    throw new Error("Weight must be a non-negative number");
  }

  if (!Number.isInteger(input.reps) || input.reps < 1) {
    throw new Error("Reps must be a positive integer");
  }

  if (
    input.felt !== undefined &&
    input.felt !== null &&
    !["easy", "moderate", "hard"].includes(input.felt)
  ) {
    throw new Error("Invalid effort level");
  }
}

export async function createWorkoutSession(
  input: CreateWorkoutSessionInput = {}
) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const targetDate =
    input.date ?? new Date().toISOString().slice(0, 10);

  const { data: existingSession, error: existingSessionError } =
    await supabase
      .from("workout_sessions")
      .select("id, completed_at")
      .eq("user_id", user.id)
      .eq("date", targetDate)
      .is("completed_at", null)
      .maybeSingle();

  if (existingSessionError) {
    throw new Error("Unable to check existing workout session");
  }

  if (existingSession) {
    return existingSession;
  }

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      date: targetDate,
      started_at: input.started_at ?? null,
      notes: input.notes ?? null,
    })
    .select(
      "id, date, started_at, completed_at, notes, created_at"
    )
    .single();

  if (error) {
    throw new Error("Unable to create workout session");
  }

  return data;
}

export async function addWorkoutSet(input: CreateWorkoutSetInput) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  validateWorkoutSetInput(input);

  const supabase = await createClient();

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("id, completed_at")
    .eq("id", input.session_id)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    throw new Error("Workout session not found");
  }

  if (session.completed_at !== null) {
    throw new Error("Workout session is already completed");
  }

  const { data, error } = await supabase
    .from("workout_sets")
    .insert({
      session_id: input.session_id,
      exercise_name: input.exercise_name.trim(),
      exercise_order: input.exercise_order,
      set_number: input.set_number,
      weight: input.weight,
      reps: input.reps,
      felt: input.felt ?? null,
    })
    .select(
      "id, session_id, exercise_name, exercise_order, set_number, weight, reps, felt, created_at"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateWorkoutSet(
  input: UpdateWorkoutSetInput
) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  validateWorkoutSetInput(input);

  const supabase = await createClient();

  const { data: workoutSet, error: workoutSetError } =
    await supabase
      .from("workout_sets")
      .select("id, session_id")
      .eq("id", input.set_id)
      .single();

  if (workoutSetError || !workoutSet) {
    throw new Error("Workout set not found");
  }

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("id, completed_at")
    .eq("id", workoutSet.session_id)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    throw new Error("Workout set not found");
  }

  if (session.completed_at !== null) {
    throw new Error("Workout session is already completed");
  }

  const { data, error } = await supabase
    .from("workout_sets")
    .update({
      exercise_name: input.exercise_name.trim(),
      exercise_order: input.exercise_order,
      set_number: input.set_number,
      weight: input.weight,
      reps: input.reps,
      felt: input.felt ?? null,
    })
    .eq("id", input.set_id)
    .select(
      "id, session_id, exercise_name, exercise_order, set_number, weight, reps, felt, created_at"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteWorkoutSet(setId: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data: workoutSet, error: workoutSetError } =
    await supabase
      .from("workout_sets")
      .select("id, session_id")
      .eq("id", setId)
      .single();

  if (workoutSetError || !workoutSet) {
    throw new Error("Workout set not found");
  }

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("id, completed_at")
    .eq("id", workoutSet.session_id)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    throw new Error("Workout set not found");
  }

  if (session.completed_at !== null) {
    throw new Error("Workout session is already completed");
  }

  const { error } = await supabase
    .from("workout_sets")
    .delete()
    .eq("id", setId);

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: true,
    id: setId,
  };
}

export async function completeWorkoutSession(sessionId: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("id, completed_at")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    throw new Error("Workout session not found");
  }

  if (session.completed_at !== null) {
    throw new Error("Workout session already completed");
  }

  const { data, error } = await supabase
    .from("workout_sessions")
    .update({
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .is("completed_at", null)
    .select(
      "id, date, started_at, completed_at, notes, created_at"
    )
    .single();

  if (error || !data) {
    throw new Error("Unable to complete workout session");
  }

  return data;
}

export async function getWorkoutSessions() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*, workout_sets (*)")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) {
    throw new Error("Unable to fetch workout sessions");
  }

  return data;
}

export async function getWorkoutSession(sessionId: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*, workout_sets (*)")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    throw new Error("Workout session not found");
  }

  return data;
}