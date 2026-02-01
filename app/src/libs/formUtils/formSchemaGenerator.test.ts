import { describe, expect, it } from "vitest";

import { QuestionsData } from "@/schema/hearingFormSchema";

import { generateZodSchema } from "./formSchemaGenerator"; // パスは適宜調整してください

describe("generateZodSchema", () => {
  it("基本的な文字列項目のバリデーションが機能すること", () => {
    const mockData = [
      {
        questions: [
          { id: "q1", type: "text", required: true },
          { id: "q2", type: "text", required: false },
        ],
      },
    ] as unknown as QuestionsData;

    const schema = generateZodSchema(mockData);

    // 必須項目が空の場合
    expect(schema.safeParse({ q1: "" }).success).toBe(false);
    // 任意項目が空の場合
    expect(schema.safeParse({ q1: "値あり", q2: "" }).success).toBe(true);
  });

  it("number型のプリプロセス(文字列から数値への変換)が機能すること", () => {
    const mockData = [
      {
        questions: [{ id: "age", type: "number", required: true }],
      },
    ] as unknown as QuestionsData;

    const schema = generateZodSchema(mockData);

    // 文字列で入力しても数値としてパースされるか
    const result = schema.safeParse({ age: "30" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(30);
    }

    // 数字ではない文字列の場合
    expect(schema.safeParse({ age: "abc" }).success).toBe(false);
  });

  it("field_array のバリデーションと最小件数チェックが機能すること", () => {
    const mockData = [
      {
        questions: [
          {
            id: "users",
            type: "field_array",
            required: true,
            fields: [{ id: "name", type: "text", required: true }],
          },
        ],
      },
    ] as unknown as QuestionsData;

    const schema = generateZodSchema(mockData);

    // 1つ以上必須 (min(1)) のチェック
    expect(schema.safeParse({ users: [] }).success).toBe(false);

    // 中身の必須チェック
    expect(schema.safeParse({ users: [{ name: "" }] }).success).toBe(false);
    expect(schema.safeParse({ users: [{ name: "田中" }] }).success).toBe(true);
  });

  it("condition（条件付き）がある場合は optional になること", () => {
    const mockData = [
      {
        questions: [
          {
            id: "q_hidden",
            type: "text",
            required: true, // requiredでもconditionがあればoptional扱い
            condition: { field: "other", value: "yes" },
          },
        ],
      },
    ] as unknown as QuestionsData;

    const schema = generateZodSchema(mockData);

    // conditionがあるため、空でもパスする
    expect(schema.safeParse({ q_hidden: "" }).success).toBe(true);
  });
});
