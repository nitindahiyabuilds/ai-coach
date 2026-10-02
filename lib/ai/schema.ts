import { z } from "zod";

export const healthExplanationSchema = z.object({
  summary: z.string(),
  bmr: z.string(),
  tdee: z.string(),
  calories: z.string(),
  protein: z.string(),
  water: z.string(),
});

export type HealthExplanation = z.infer<
  typeof healthExplanationSchema
>;

export const coachResponseSchema = z.object({
  answer: z.string(),
});

export type CoachResponse = z.infer<
  typeof coachResponseSchema
>;

export const personalMemoryFactCandidateSchema = z
  .object({
    fact: z.string().min(1),
    category: z.enum([
      "preference",
      "constraint",
      "goal",
      "context",
    ]),
    evidence: z.enum(["confirmed", "inferred"]),
  })
  .strict();

export const personalMemoryExtractionSchema = z
  .object({
    facts: z.array(personalMemoryFactCandidateSchema),
  })
  .strict();

export type PersonalMemoryFactCandidate = z.infer<
  typeof personalMemoryFactCandidateSchema
>;

export type PersonalMemoryExtraction = z.infer<
  typeof personalMemoryExtractionSchema
>;