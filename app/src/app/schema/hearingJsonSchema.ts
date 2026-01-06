import { z } from "zod";

export const hearingJsonSchema = z.object({
  summary: z.string(),
  suggestions: z.array(z.string()),
  next_action: z.string(),
});

export const hearingJsonSchemaForLlm = z.toJSONSchema(hearingJsonSchema);
