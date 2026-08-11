import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import { calculateHealthMetrics } from "@/lib/calculations";

export async function buildUserContext() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      `
        age,
        sex,
        height_cm,
        weight_kg,
        activity_level,
        goal,
        training_experience,
        equipment,
        dietary_preference,
        region
      `
    )
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const healthMetrics = calculateHealthMetrics({
    age: profile.age,
    sex: profile.sex,
    height: profile.height_cm,
    weight: profile.weight_kg,
    activityLevel: profile.activity_level,
    goal: profile.goal,
  });

  return {
    profile: {
      age: profile.age,
      sex: profile.sex,
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      activity_level: profile.activity_level,
      goal: profile.goal,
      training_experience: profile.training_experience,
      equipment: profile.equipment,
      dietary_preference: profile.dietary_preference,
      region: profile.region,
    },

    healthMetrics,
  };
}