import { describe, expect, it } from "vitest";
import type {
  PersonalMemoryFact,
  PersonalMemoryCategory,
  PersonalMemoryEvidence,
  PersonalMemorySource,
  PersonalMemoryStatus,
} from "@/lib/contracts/personal-memory";

describe("personal memory contract", () => {
  it("supports the canonical memory fact shape", () => {
    const fact: PersonalMemoryFact = {
      id: "memory-1",
      user_id: "user-1",
      fact: "I prefer morning workouts.",
      category: "preference",
      source: "user",
      evidence: "confirmed",
      status: "active",
      created_at: "2026-10-02T00:00:00.000Z",
      updated_at: "2026-10-02T00:00:00.000Z",
      supersedes_id: null,
    };

    expect(fact.category).toBe("preference");
    expect(fact.source).toBe("user");
    expect(fact.evidence).toBe("confirmed");
    expect(fact.status).toBe("active");
  });

  it("supports every canonical category", () => {
    const categories: PersonalMemoryCategory[] = [
      "preference",
      "constraint",
      "goal",
      "context",
    ];

    expect(categories).toHaveLength(4);
  });

  it("supports every canonical source", () => {
    const sources: PersonalMemorySource[] = [
      "user",
      "system_observation",
      "inference",
    ];

    expect(sources).toHaveLength(3);
  });

  it("supports every evidence state", () => {
    const evidence: PersonalMemoryEvidence[] = [
      "confirmed",
      "observed",
      "inferred",
      "unknown",
      "contradictory",
    ];

    expect(evidence).toHaveLength(5);
  });

  it("supports every memory lifecycle status", () => {
    const statuses: PersonalMemoryStatus[] = [
      "active",
      "superseded",
      "invalidated",
      "contradictory",
    ];

    expect(statuses).toHaveLength(4);
  });
});
