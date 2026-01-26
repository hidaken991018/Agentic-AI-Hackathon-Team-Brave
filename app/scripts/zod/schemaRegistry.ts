import { z } from "zod";

import { aiCommentJsonSchema } from "@/schema/aiCommentJson/aiCommentJsonSchema";
import { hearingJsonSchema } from "@/schema/hearingJson/hearingJsonSchema";
import { lifePlanJsonSchema } from "@/schema/lifePlanJson/lifePlanJsonSchema";

export const schemaRegistry = {
  aiCommentJson: {
    schema: aiCommentJsonSchema,
    output: "aiCommentJson.sample.json",
  },
  hearingJson: {
    schema: hearingJsonSchema,
    output: "hearingJson.sample.json",
  },
  lifePlanJson: {
    schema: lifePlanJsonSchema,
    output: "lifePlanJson.sample.json",
  },
} satisfies Record<
  string,
  {
    schema: z.ZodTypeAny;
    output: string;
  }
>;

export type SchemaKey = keyof typeof schemaRegistry;
