import { UserProfile } from "./types";

export function calculateBMR(profile: UserProfile): number {
  const { age, sex, height, weight } = profile;

  if (sex === "male") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }

  return 10 * weight + 6.25 * height - 5 * age - 161;
}