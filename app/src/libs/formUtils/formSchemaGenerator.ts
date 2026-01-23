import { z } from "zod";

/**
 * JSONの型定義に合わせて動的にZodスキーマを生成する
 */
export const generateZodSchema = (steps: any[]) => {
  const schemaShape: Record<string, any> = {};

  steps.forEach((step) => {
    step.questions.forEach((q: any) => {
      // 1. お子様などの「field_array」形式の場合
      if (q.type === "field_array") {
        const itemShape: Record<string, any> = {};
        q.fields.forEach((field: any) => {
          itemShape[field.id] = createZodField(field);
        });
        schemaShape[q.id] = z.array(z.object(itemShape));
      }
      // 2. 通常の入力項目の場合
      else {
        schemaShape[q.id] = createZodField(q);
      }
    });
  });

  return z.object(schemaShape);
};

/**
 * 個別のフィールドに対して、型に応じたバリデーションを割り当てる
 */
function createZodField(field: any) {
  let schema: any;

  // 1. 基本的な型の定義
  switch (field.type) {
    case "number":
      schema = z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number({ invalid_type_error: "数字を入力してください" }),
      );
      break;
    case "field_array":
      console.log("Creating field_array schema for field:", field);
      // 再帰的に中身のスキーマを作成
      const itemShape: Record<string, any> = {};
      field.fields.forEach((f: any) => {
        itemShape[f.id] = createZodField(f);
      });
      schema = z.array(z.object(itemShape));
      break;
    default:
      schema = z.string();
  }

  // 2. バリデーションルールの適用（型に合わせて分岐）
  if (field.required && !field.condition) {
    if (field.type === "field_array") {
      // 配列の場合は1つ以上の要素を必須にする
      schema = schema.min(1, { message: "少なくとも1つは入力が必要です" });
    } else if (field.type !== "number") {
      // 文字列の場合は最低1文字を必須にする
      schema = schema.min(1, { message: "必須項目です" });
    }
    // number の場合は preprocess ですでに数値化されているため追加不要
  } else {
    // 必須でない、または条件付きの場合は空を許容
    if (field.type === "field_array") {
      schema = schema.optional().default([]);
    } else {
      schema = schema.optional().or(z.literal(""));
    }
  }

  return schema;
}
