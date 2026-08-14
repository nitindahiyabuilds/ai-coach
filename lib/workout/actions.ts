"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";

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

export async function createWorkoutSession(
  input: CreateWorkoutSessionInput = {}
) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      date: input.date,
      started_at: input.started_at,
      notes: input.notes,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function addWorkoutSet(input: CreateWorkoutSetInput) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("id", input.session_id)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    throw new Error("Workout session not found");
  }

  const { data, error } = await supabase
    .from("workout_sets")
    .insert({
      session_id: input.session_id,
      exercise_name: input.exercise_name,
      exercise_order: input.exercise_order,
      set_number: input.set_number,
      weight: input.weight,
      reps: input.reps,
      felt: input.felt ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function completeWorkoutSession(sessionId: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workout_sessions")
    .update({
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
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
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) {
    throw new Error(error.message);
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
    .select(
      `
        *,
        workout_sets (*)
      `
    )
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}