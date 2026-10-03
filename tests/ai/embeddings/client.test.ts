import { describe, expect, it } from "vitest";
import { generatePersonalMemoryEmbedding } from "@/lib/ai/embeddings/client";

describe("generatePersonalMemoryEmbedding", () => {
  it("rejects empty text", async () => {
    await expect(generatePersonalMemoryEmbedding("")).rejects.toThrow(
      "Cannot generate an embedding for empty text",
    );
  });

  it("rejects whitespace-only text", async () => {
    await expect(generatePersonalMemoryEmbedding("   ")).rejects.toThrow(
      "Cannot generate an embedding for empty text",
    );
  });
});