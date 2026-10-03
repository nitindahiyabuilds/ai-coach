import { generatePersonalMemoryEmbedding } from "@/lib/ai/embeddings/client";
import type {
  PersonalMemorySearchResult,
  PersonalMemoryRetrievalOptions,
} from "@/lib/contracts/personal-memory-retrieval";
import { getCurrentUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 5;
const DEFAULT_THRESHOLD = 0.7;
const MAX_LIMIT = 20;

function validateOptions(options: PersonalMemoryRetrievalOptions) {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new Error(
      `Retrieval limit must be an integer between 1 and ${MAX_LIMIT}`,
    );
  }

  if (
    !Number.isFinite(threshold) ||
    threshold < 0 ||
    threshold > 1
  ) {
    throw new Error("Retrieval threshold must be between 0 and 1");
  }

  return {
    limit,
    threshold,
  };
}

export async function retrievePersonalMemoryFacts(
  query: string,
  options: PersonalMemoryRetrievalOptions = {},
): Promise<PersonalMemorySearchResult[]> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    throw new Error("Cannot retrieve personal memory for an empty query");
  }

  const { limit, threshold } = validateOptions(options);

  const queryEmbedding =
    await generatePersonalMemoryEmbedding(normalizedQuery);

  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "match_personal_memory_facts",
    {
      query_embedding: queryEmbedding,
      match_count: limit,
      match_threshold: threshold,
    },
  );

  if (error) {
    throw new Error(
      `Failed to retrieve personal memory facts: ${error.message}`,
    );
  }

  return (data ?? []) as PersonalMemorySearchResult[];
}