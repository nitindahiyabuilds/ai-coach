import { beforeEach, describe, expect, it, vi } from "vitest";
import { savePersonalMemoryFact } from "@/lib/memory/facts";

const {
  mockGetCurrentUser,
  mockCreateClient,
  mockGeneratePersonalMemoryEmbedding,
} = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
  mockCreateClient: vi.fn(),
  mockGeneratePersonalMemoryEmbedding: vi.fn(),
}));

vi.mock("@/lib/auth/user", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/lib/ai/embeddings/client", () => ({
  generatePersonalMemoryEmbedding: mockGeneratePersonalMemoryEmbedding,
}));

describe("savePersonalMemoryFact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    await expect(
      savePersonalMemoryFact(
        {
          fact: "Prefers morning workouts",
          category: "preference",
          evidence: "confirmed",
        },
        {
          source: "user",
        },
      ),
    ).rejects.toThrow("Unauthorized");

    expect(mockGeneratePersonalMemoryEmbedding).not.toHaveBeenCalled();
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("generates an embedding and saves the fact with the embedding", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "user-123",
    });

    const embedding = [0.1, 0.2, 0.3];

    mockGeneratePersonalMemoryEmbedding.mockResolvedValue(embedding);

    const single = vi.fn().mockResolvedValue({
      data: {
        id: "fact-123",
        user_id: "user-123",
        fact: "Prefers morning workouts",
        category: "preference",
        source: "user",
        evidence: "confirmed",
        status: "active",
        created_at: "2026-10-03T00:00:00.000Z",
        updated_at: "2026-10-03T00:00:00.000Z",
        supersedes_id: null,
      },
      error: null,
    });

    const select = vi.fn().mockReturnValue({
      single,
    });

    const insert = vi.fn().mockReturnValue({
      select,
    });

    mockCreateClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({
        insert,
      }),
    });

    const result = await savePersonalMemoryFact(
      {
        fact: "Prefers morning workouts",
        category: "preference",
        evidence: "confirmed",
      },
      {
        source: "user",
      },
    );

    expect(mockGeneratePersonalMemoryEmbedding).toHaveBeenCalledWith(
      "Prefers morning workouts",
    );

    expect(insert).toHaveBeenCalledWith({
      user_id: "user-123",
      fact: "Prefers morning workouts",
      category: "preference",
      source: "user",
      evidence: "confirmed",
      status: "active",
      supersedes_id: null,
      embedding,
    });

    expect(result.id).toBe("fact-123");
    expect(result.fact).toBe("Prefers morning workouts");
  });

  it("preserves explicit lifecycle options", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "user-123",
    });

    const embedding = [0.4, 0.5, 0.6];

    mockGeneratePersonalMemoryEmbedding.mockResolvedValue(embedding);

    const single = vi.fn().mockResolvedValue({
      data: {
        id: "fact-456",
        user_id: "user-123",
        fact: "Wants to train five days per week",
        category: "goal",
        source: "user",
        evidence: "confirmed",
        status: "active",
        created_at: "2026-10-03T00:00:00.000Z",
        updated_at: "2026-10-03T00:00:00.000Z",
        supersedes_id: "fact-old",
      },
      error: null,
    });

    const select = vi.fn().mockReturnValue({
      single,
    });

    const insert = vi.fn().mockReturnValue({
      select,
    });

    mockCreateClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({
        insert,
      }),
    });

    await savePersonalMemoryFact(
      {
        fact: "Wants to train five days per week",
        category: "goal",
        evidence: "confirmed",
      },
      {
        source: "user",
        status: "active",
        supersedesId: "fact-old",
      },
    );

    expect(insert).toHaveBeenCalledWith({
      user_id: "user-123",
      fact: "Wants to train five days per week",
      category: "goal",
      source: "user",
      evidence: "confirmed",
      status: "active",
      supersedes_id: "fact-old",
      embedding,
    });
  });

  it("surfaces database errors", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "user-123",
    });

    mockGeneratePersonalMemoryEmbedding.mockResolvedValue([
      0.1,
      0.2,
      0.3,
    ]);

    const single = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: "database insert failed",
      },
    });

    const select = vi.fn().mockReturnValue({
      single,
    });

    const insert = vi.fn().mockReturnValue({
      select,
    });

    mockCreateClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({
        insert,
      }),
    });

    await expect(
      savePersonalMemoryFact(
        {
          fact: "Likes running",
          category: "preference",
          evidence: "confirmed",
        },
        {
          source: "user",
        },
      ),
    ).rejects.toThrow(
      "Failed to save personal memory fact: database insert failed",
    );
  });
});