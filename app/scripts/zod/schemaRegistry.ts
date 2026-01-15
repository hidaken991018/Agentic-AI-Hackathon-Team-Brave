import { z } from "zod";

import { hearingJsonSchema } from "@/schema/hearingJsonSchema";

export const schemaRegistry = {
  hearingJson: {
    schema: hearingJsonSchema,
    output: "hearingJson.sample.json",
  },
} satisfies Record<
  string,
  {
    schema: z.ZodTypeAny;
    output: string;
  }
>;

export type SchemaKey = keyof typeof schemaRegistry;
