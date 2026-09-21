import type { AIProvider } from "./provider";
import { GroqProvider } from "./providers/groq";

export function createAIProvider(): AIProvider {
  return new GroqProvider();
}
