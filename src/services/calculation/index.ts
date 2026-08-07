import { calculateBMR } from "./bmr";
import { calculateTDEE } from "./tdee";
import { calculateCalorieTarget } from "./calories";
import { calculateProteinTarget } from "./protein";
import { calculateWaterTarget } from "./water";
import { UserProfile } from "./types";

export function calculateHealthMetrics(profile: UserProfile) {
  return {
    bmr: calculateBMR(profile),
    tdee: calculateTDEE(profile),
    calories: calculateCalorieTarget(profile),
    protein: calculateProteinTarget(profile),
    water: calculateWaterTarget(profile),
  };
}