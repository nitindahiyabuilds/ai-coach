import { UserProfile } from "./types";

export function calculateProteinTarget(profile: UserProfile): number {
  switch (profile.goal) {
    case "fat_loss":
      return profile.weight * 2.2;

    case "muscle_gain":
      return profile.weight * 2.0;

    case "maintenance":
    default:
      return profile.weight * 1.6;
  }
}