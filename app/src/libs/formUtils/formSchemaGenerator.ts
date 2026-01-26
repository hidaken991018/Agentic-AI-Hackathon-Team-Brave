import _ from "lodash";
import { z } from "zod";

import { QuestionsData } from "@/schema/hearingFormSchema";

export const generateZodSchema = (steps: QuestionsData) => {
  const schemaShape: z.ZodRawShape = {};

  steps.forEach((step) => {
    step.questions.forEach((q) => {
      _.set(schemaShape, q.id, createZodField(q as any));
    });
  });

  return z.object(schemaShape);
};

function createZodField(field: any): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  switch (field.type) {
    case "number":
      schema = z.preprocess(
        (val) => (val === "" || val === undefined ? undefined : Number(val)),
        z.number({ message: "数字を入力してください" }),
      );
      break;

    case "field_array":
      const itemShape: z.ZodRawShape = {};
      (field.fields ?? []).forEach((f: any) => {
        _.set(itemShape, f.id, createZodField(f));
      });
      schema = z.array(z.object(itemShape));
      break;

    default:
      schema = z.string();
  }

  // 必須・条件付きのバリデーション適用
  const isOptional = !field.required || !!field.condition;
  if (isOptional) {
    if (field.type === "field_array") {
      schema = (schema as z.ZodArray<any>).default([]);
    } else {
      schema = schema.optional().or(z.literal(""));
    }
  } else {
    if (field.type === "field_array") {
      schema = (schema as z.ZodArray<any>).min(1, "1つ以上入力が必要です");
    } else if (field.type !== "number") {
      schema = (schema as z.ZodString).min(1, "必須項目です");
    }
  }

  return schema;
}
