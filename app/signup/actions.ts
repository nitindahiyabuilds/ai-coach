"use server";

import { createClient } from "@/lib/supabase/server";

export async function signup(
  prevState: { success: boolean; message: string },
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    message: "Check your email to verify your account.",
  };
}