import { calculateBMR } from "./bmr";
import { ActivityLevel, UserProfile } from "./types";

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateTDEE(profile: UserProfile): number {

  const bmr = calculateBMR(profile);

  return bmr * activityMultipliers[profile.activityLevel];
}
