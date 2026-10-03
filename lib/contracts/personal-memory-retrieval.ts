import type { PersonalMemoryFact } from "@/lib/contracts/personal-memory";

export type PersonalMemoryRetrievalOptions = {
  limit?: number;
  threshold?: number;
};

export type PersonalMemorySearchResult = PersonalMemoryFact & {
  similarity: number;
};