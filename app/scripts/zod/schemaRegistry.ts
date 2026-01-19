import { z } from "zod";

import { hearingJsonSchema } from "@/schema/hearingJson/hearingJsonSchema";
import { lifePlanJsonSchema } from "@/schema/lifePlanJson/lifePlanJsonSchema";

export const schemaRegistry = {
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
