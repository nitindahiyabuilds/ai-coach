import OpenAI from "openai";
import type { AIProvider } from "../provider";

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error("GROQ_API_KEY is not configured");
}

const ai = new OpenAI({
  apiKey,
  baseURL: "https://api.groq.com/openai/v1",
});

const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

export class GroqProvider implements AIProvider {
  async generateStructuredResponse(input: {
    prompt: string;
    schemaName: string;
    schema: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
      additionalProperties: false;
    };
  }): Promise<unknown> {
    const response = await ai.responses.create({
      model,
      input: input.prompt,
      text: {
        format: {
          type: "json_schema",
          name: input.schemaName,
          strict: true,
          schema: input.schema,
        },
      },
    });

    if (!response.output_text) {
      throw new Error("AI returned an empty response");
    }

    try {
      return JSON.parse(response.output_text);
    } catch {
      throw new Error("AI returned invalid JSON");
    }
  }
}
