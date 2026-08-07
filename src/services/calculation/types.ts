export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export interface UserProfile {
  age: number;
  sex: "male" | "female";
  height: number; // cm
  weight: number; // kg
  activityLevel: ActivityLevel;
}