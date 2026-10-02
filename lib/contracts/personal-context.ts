import type { ActivityLevel, Goal } from "@/lib/calculations/types";

export type PersonalContextProfile = {
  age: number;
  sex: "male" | "female";
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal: Goal;
  training_experience: string;
  equipment: string;
  dietary_preference: string;
  region: string;
};

export type PersonalContextHealthMetrics = {
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  water: number;
};

export type PersonalContext = {
  profile: PersonalContextProfile;
  healthMetrics: PersonalContextHealthMetrics;
};