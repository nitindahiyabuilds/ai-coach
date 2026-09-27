"use server";

import {
  getWorkoutSessions,
  type WorkoutHistoryInput,
} from "@/lib/workout/actions";
import {
  analyzeWorkoutHistory,
  type WorkoutAnalysis,
  type WorkoutSession,
} from "@/lib/workout/workout";

export async function getWorkoutAnalysis(
  input: WorkoutHistoryInput = {}
): Promise<WorkoutAnalysis | null> {
  const sessions = await getWorkoutSessions(input);

  const completedSessions = sessions.filter(
    (session) => session.completed_at !== null
  ) as WorkoutSession[];

  return analyzeWorkoutHistory(completedSessions);
}