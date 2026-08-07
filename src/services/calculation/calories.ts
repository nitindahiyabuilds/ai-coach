import { UserProfile } from "./types";
import { calculateTDEE } from "./tdee";

export function calculateCalorieTarget(profile: UserProfile): number {
  const tdee = calculateTDEE(profile);

  switch (profile.goal) {
    case "fat_loss":
      return tdee - 500;

    case "muscle_gain":
      return tdee + 300;

    case "maintenance":
    default:
      return tdee;
  }
}