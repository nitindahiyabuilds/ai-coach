import type { WorkoutPlan } from "./workout";

export type CoachResponse = {
  success: true;
  answer: string;
  workoutPlan: WorkoutPlan | null;
};

export type CoachErrorResponse = {
  success: false;
  message: string;
};