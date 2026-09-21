"use server";

import { getCurrentUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import {
  analyzeWorkoutHistory,
  type WorkoutAnalysis,
  type WorkoutSession,
} from "@/lib/workout/workout";

export async function getWorkoutAnalysis(): Promise<WorkoutAnalysis | null> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      `
        id,
        user_id,
        date,
        started_at,
        completed_at,
        notes,
        created_at,
        workout_sets (
          id,
          session_id,
          exercise_name,
          exercise_order,
          set_number,
          weight,
          reps,
          felt,
          created_at
        )
      `
    )
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const sessions = (data ?? []) as WorkoutSession[];

  return analyzeWorkoutHistory(sessions);
}