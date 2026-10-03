import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  generatePersonalMemoryEmbedding: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@/lib/auth/user", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/ai/embeddings/client", () => ({
  generatePersonalMemoryEmbedding:
    mocks.generatePersonalMemoryEmbedding,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { retrievePersonalMemoryFacts } from "@/lib/memory/retrieval";

describe("retrievePersonalMemoryFacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    await expect(
      retrievePersonalMemoryFacts("morning workout"),
    ).rejects.toThrow("Unauthorized");

    expect(
      mocks.generatePersonalMemoryEmbedding,
    ).not.toHaveBeenCalled();

    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("rejects an empty query", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
    });

    await expect(
      retrievePersonalMemoryFacts("   "),
    ).rejects.toThrow(
      "Cannot retrieve personal memory for an empty query",
    );

    expect(
      mocks.generatePersonalMemoryEmbedding,
    ).not.toHaveBeenCalled();
  });

  it("generates a query embedding and retrieves matching memories", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
    });

    const queryEmbedding = [0.1, 0.2, 0.3];

    mocks.generatePersonalMemoryEmbedding.mockResolvedValue(
      queryEmbedding,
    );

    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          id: "memory-1",
          user_id: "user-1",
          fact: "Prefers morning workouts",
          category: "preference",
          source: "user",
          evidence: "confirmed",
          status: "active",
          created_at: "2026-10-03T10:00:00Z",
          updated_at: "2026-10-03T10:00:00Z",
          supersedes_id: null,
          similarity: 0.91,
        },
      ],
      error: null,
    });

    mocks.createClient.mockResolvedValue({
      rpc,
    });

    const result = await retrievePersonalMemoryFacts(
      "When does the user prefer to train?",
    );

    expect(
      mocks.generatePersonalMemoryEmbedding,
    ).toHaveBeenCalledWith(
      "When does the user prefer to train?",
    );

    expect(rpc).toHaveBeenCalledWith(
      "match_personal_memory_facts",
      {
        query_embedding: queryEmbedding,
        match_count: 5,
        match_threshold: 0.7,
      },
    );

    expect(result).toEqual([
      {
        id: "memory-1",
        user_id: "user-1",
        fact: "Prefers morning workouts",
        category: "preference",
        source: "user",
        evidence: "confirmed",
        status: "active",
        created_at: "2026-10-03T10:00:00Z",
        updated_at: "2026-10-03T10:00:00Z",
        supersedes_id: null,
        similarity: 0.91,
      },
    ]);
  });

  it("uses explicit retrieval options", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
    });

    mocks.generatePersonalMemoryEmbedding.mockResolvedValue([
      0.1,
      0.2,
      0.3,
    ]);

    const rpc = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    mocks.createClient.mockResolvedValue({
      rpc,
    });

    await retrievePersonalMemoryFacts(
      "training constraints",
      {
        limit: 10,
        threshold: 0.8,
      },
    );

    expect(rpc).toHaveBeenCalledWith(
      "match_personal_memory_facts",
      {
        query_embedding: [0.1, 0.2, 0.3],
        match_count: 10,
        match_threshold: 0.8,
      },
    );
  });

  it("rejects an invalid retrieval limit", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
    });

    await expect(
      retrievePersonalMemoryFacts("training", {
        limit: 21,
      }),
    ).rejects.toThrow(
      "Retrieval limit must be an integer between 1 and 20",
    );

    expect(
      mocks.generatePersonalMemoryEmbedding,
    ).not.toHaveBeenCalled();
  });

  it("rejects an invalid retrieval threshold", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
    });

    await expect(
      retrievePersonalMemoryFacts("training", {
        threshold: 1.1,
      }),
    ).rejects.toThrow(
      "Retrieval threshold must be between 0 and 1",
    );

    expect(
      mocks.generatePersonalMemoryEmbedding,
    ).not.toHaveBeenCalled();
  });

  it("rejects a non-finite retrieval threshold", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
    });

    await expect(
      retrievePersonalMemoryFacts("training", {
        threshold: Number.NaN,
      }),
    ).rejects.toThrow(
      "Retrieval threshold must be between 0 and 1",
    );

    expect(
      mocks.generatePersonalMemoryEmbedding,
    ).not.toHaveBeenCalled();
  });

  it("surfaces database retrieval errors", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      id: "user-1",
    });

    mocks.generatePersonalMemoryEmbedding.mockResolvedValue([
      0.1,
      0.2,
      0.3,
    ]);

    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: "RPC failed",
      },
    });

    mocks.createClient.mockResolvedValue({
      rpc,
    });

    await expect(
      retrievePersonalMemoryFacts("training preferences"),
    ).rejects.toThrow(
      "Failed to retrieve personal memory facts: RPC failed",
    );
  });
});