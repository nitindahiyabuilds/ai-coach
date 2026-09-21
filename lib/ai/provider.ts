export type AIJsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: false;
};

export interface AIProvider {
  generateStructuredResponse(input: {
    prompt: string;
    schemaName: string;
    schema: AIJsonSchema;
  }): Promise<unknown>;
}
