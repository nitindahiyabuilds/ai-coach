import { UserProfile } from "./types";

export function calculateWaterTarget(profile: UserProfile): number {
  return profile.weight * 35; // ml/day
}
