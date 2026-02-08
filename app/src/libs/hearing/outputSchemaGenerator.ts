/**
 * outputSchema 動的生成モジュール
 *
 * related フィールドの ID から質問定義を取得し、
 * 質問の type に基づいて Gemini API 用の JSON Schema を動的生成します。
 *
 * @module outputSchemaGenerator
 */

import { CONSTS } from "@/consts";
import { FlexibleQuestion } from "@/schema/hearingFormSchema";
import { JsonSchema } from "@/services/hearing/schema/interpretedDataSchema";

/**
 * related フィールドの ID から outputSchema を動的生成
 *
 * @param relatedIds - 推定対象の質問 ID リスト (例: ["#016", "#017", "#020"])
 * @returns Gemini API 用の JSON Schema
 *
 * @example
 * const schema = generateOutputSchema(["#016", "#017"]);
 * // {
 * //   type: "object",
 * //   properties: {
 * //     q16: { type: "number", description: "現在の年齢" },
 * //     q17: { type: "string", description: "性別" }
 * //   },
 * //   required: ["q16"]
 * // }
 */
export function generateOutputSchema(relatedIds: string[]): JsonSchema {
  const properties: Record<string, { type: string; description?: string }> = {};
  const required: string[] = [];

  for (const relatedId of relatedIds) {
    // "#016" -> "q016" のように ID を正規化
    // まず "#" を除去
    let normalizedId = relatedId.replace("#", "");
    
    // 3桁の0埋め形式を保持したまま "q" をプレフィックス
    // 例: "016" -> "q016", "1" -> "q001"
    if (normalizedId.length === 1) {
      normalizedId = `q00${normalizedId}`;
    } else if (normalizedId.length === 2) {
      normalizedId = `q0${normalizedId}`;
    } else {
      normalizedId = `q${normalizedId}`;
    }

    // CONSTS.QUESTIONS から該当質問を検索
    let foundQuestion: FlexibleQuestion | undefined = undefined;
    
    for (const step of CONSTS.QUESTIONS) {
      foundQuestion = step.questions.find(
        (q) => q.id === normalizedId,
      ) as FlexibleQuestion | undefined;
      
      if (foundQuestion) break;
    }

    if (!foundQuestion) {
      console.warn(`[outputSchemaGenerator] Question not found for ID: ${relatedId}`);
      continue;
    }

    // 質問の type に基づいてスキーマ型を決定
    let schemaType = "string";
    
    if (foundQuestion.type === "number") {
      schemaType = "number";
    } else if (
      foundQuestion.type === "radio" ||
      foundQuestion.type === "select"
    ) {
      schemaType = "string";
    } else if (foundQuestion.type === "text" || foundQuestion.type === "textarea") {
      schemaType = "string";
    }

    properties[normalizedId] = {
      type: schemaType,
      description: foundQuestion.label,
    };

    if (foundQuestion.required) {
      required.push(normalizedId);
    }
  }

  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
  };
}
