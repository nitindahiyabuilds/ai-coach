export type PersonalMemoryCategory =
  | "preference"
  | "constraint"
  | "goal"
  | "context";

export type PersonalMemorySource =
  | "user"
  | "system_observation"
  | "inference";

export type PersonalMemoryEvidence =
  | "confirmed"
  | "observed"
  | "inferred"
  | "unknown"
  | "contradictory";

export type PersonalMemoryStatus =
  | "active"
  | "superseded"
  | "invalidated"
  | "contradictory";

export type PersonalMemoryFactCandidate = {
  fact: string;
  category: PersonalMemoryCategory;
  evidence: "confirmed" | "inferred";
};

export type PersonalMemoryFact = {
  id: string;
  user_id: string;
  fact: string;
  category: PersonalMemoryCategory;
  source: PersonalMemorySource;
  evidence: PersonalMemoryEvidence;
  status: PersonalMemoryStatus;
  created_at: string;
  updated_at: string;
  supersedes_id: string | null;
};