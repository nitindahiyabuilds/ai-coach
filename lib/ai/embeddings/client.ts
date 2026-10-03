import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

const MODEL_NAME = "Supabase/gte-small";

let embeddingPipeline: Promise<FeatureExtractionPipeline> | null = null;

function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
  if (!embeddingPipeline) {
    embeddingPipeline = pipeline("feature-extraction", MODEL_NAME);
  }

  return embeddingPipeline;
}

export async function generatePersonalMemoryEmbedding(
  text: string,
): Promise<number[]> {
  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new Error("Cannot generate an embedding for empty text");
  }

  const extractor = await getEmbeddingPipeline();

  const output = await extractor(normalizedText, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
}