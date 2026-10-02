import { describe, expect, it } from "vitest";
import { buildPersonalMemoryExtractionPrompt } from "@/lib/ai/memory/prompt";

describe("buildPersonalMemoryExtractionPrompt", () => {
  it("includes the user message", () => {
    const prompt = buildPersonalMemoryExtractionPrompt(
      "I prefer working out in the morning.",
    );

    expect(prompt).toContain(
      "I prefer working out in the morning.",
    );
  });

  it("defines the allowed memory categories", () => {
    const prompt = buildPersonalMemoryExtractionPrompt(
      "I prefer working out in the morning.",
    );

    expect(prompt).toContain("preference");
    expect(prompt).toContain("constraint");
    expect(prompt).toContain("goal");
    expect(prompt).toContain("context");
  });

  it("defines confirmed and inferred evidence", () => {
    const prompt = buildPersonalMemoryExtractionPrompt(
      "I prefer working out in the morning.",
    );

    expect(prompt).toContain("confirmed");
    expect(prompt).toContain("inferred");
  });

  it("prevents the model from deciding persistence lifecycle", () => {
    const prompt = buildPersonalMemoryExtractionPrompt(
      "I prefer working out in the morning.",
    );

    expect(prompt).toContain(
      "Do not decide whether a fact should replace, supersede, invalidate, or contradict an existing memory.",
    );

    expect(prompt).toContain(
      "The application will decide persistence, source, lifecycle, and conflict handling.",
    );
  });

  it("prevents database fields from being extracted", () => {
    const prompt = buildPersonalMemoryExtractionPrompt(
      "I prefer working out in the morning.",
    );

    expect(prompt).toContain(
      "Do not include database fields such as id, user_id, source, status, timestamps, or supersedes_id.",
    );
  });

  it("allows extraction to return no facts", () => {
    const prompt = buildPersonalMemoryExtractionPrompt(
      "What should I do for my workout today?",
    );

    expect(prompt).toContain(
      "If there are no durable personal facts, return an empty facts array.",
    );
  });
});