"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import { profileSchema } from "./validation";
import { redirect } from "next/navigation";

export type ProfileState = {
  success: boolean;
  message: string;
};

export async function createProfile(
  _: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    age: formData.get("age"),
    sex: formData.get("sex"),
    height_cm: formData.get("height_cm"),
    weight_kg: formData.get("weight_kg"),
    activity_level: formData.get("activity_level"),
    goal: formData.get("goal"),
    training_experience: formData.get("training_experience"),
    equipment: formData.get("equipment"),
    dietary_preference: formData.get("dietary_preference"),
    region: formData.get("region"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0].message,
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    full_name: parsed.data.full_name,
    age: parsed.data.age,
    sex: parsed.data.sex,
    height_cm: parsed.data.height_cm,
    weight_kg: parsed.data.weight_kg,
    activity_level: parsed.data.activity_level,
    goal: parsed.data.goal,
    training_experience: parsed.data.training_experience,
    equipment: parsed.data.equipment,
    dietary_preference: parsed.data.dietary_preference,
    region: parsed.data.region,
    },
  {
    onConflict: "id",
  }
);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  redirect("/");
}