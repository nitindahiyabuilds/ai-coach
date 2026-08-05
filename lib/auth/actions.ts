"use server";

import { signUpSchema } from "./validation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  success: boolean;
  message: string;
};

export async function signUp(
  _: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0].message,
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  });

  if (error?.code === "over_email_send_rate_limit") {
  return {
    success: false,
    message:
      "Too many verification emails have been requested. Please wait about an hour before trying again.",
  };
}

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