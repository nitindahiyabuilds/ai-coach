export type PostWorkoutFeedback =
  | "easy"
  | "smooth"
  | "good"
  | "hard"
  | "brutal";

export type WorkoutSet = {
  id: string;
  session_id: string;
  exercise_name: string;
  exercise_order: number;
  set_number: number;
  weight: number;
  reps: number;
  felt: "easy" | "moderate" | "hard" | null;
  created_at: string;
};

export type WorkoutSession = {
  id: string;
  user_id: string;
  date: string;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  post_workout_feedback: PostWorkoutFeedback | null;
  created_at: string;
  workout_sets: WorkoutSet[];
};

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

export type WorkoutHistoryInput = {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};