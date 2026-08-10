"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import { calculateHealthMetrics } from "@/lib/calculations";

export async function getHealthMetrics() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return calculateHealthMetrics({
  age: profile.age,
  sex: profile.sex,
  height: profile.height_cm,
  weight: profile.weight_kg,
  activityLevel: profile.activity_level,
  goal: profile.goal,
});
}
