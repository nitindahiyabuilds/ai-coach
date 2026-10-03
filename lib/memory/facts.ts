import { generatePersonalMemoryEmbedding } from "@/lib/ai/embeddings/client";
import type {
  PersonalMemoryFact,
  PersonalMemoryFactCandidate,
  PersonalMemorySource,
  PersonalMemoryStatus,
} from "@/lib/contracts/personal-memory";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";

type SavePersonalMemoryFactOptions = {
  source: PersonalMemorySource;
  status?: PersonalMemoryStatus;
  supersedesId?: string | null;
};

export async function savePersonalMemoryFact(
  candidate: PersonalMemoryFactCandidate,
  options: SavePersonalMemoryFactOptions,
): Promise<PersonalMemoryFact> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const embedding = await generatePersonalMemoryEmbedding(candidate.fact);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("personal_memory_facts")
    .insert({
      user_id: user.id,
      fact: candidate.fact,
      category: candidate.category,
      source: options.source,
      evidence: candidate.evidence,
      status: options.status ?? "active",
      supersedes_id: options.supersedesId ?? null,
      embedding,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save personal memory fact: ${error.message}`);
  }

  return data as PersonalMemoryFact;
}