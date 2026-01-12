import { z } from "zod";

export const hearingJsonSchema = z.object({
  summary: z.string(),
  suggestions: z.array(z.string()),
  nextAction: z.string(),
});

export const hearingJsonSchemaForLlm = z.toJSONSchema(hearingJsonSchema);
