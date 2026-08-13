import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";

export type CoachMessage = {
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export async function saveCoachMessage(
  role: CoachMessage["role"],
  content: string
) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("coach_messages")
    .insert({
      user_id: user.id,
      role,
      content,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save coach message: ${error.message}`);
  }

  return data;
}

export async function getCoachMessages(
  limit = 20
): Promise<CoachMessage[]> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("coach_messages")
    .select("role, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load coach messages: ${error.message}`);
  }

  return data ?? [];
}