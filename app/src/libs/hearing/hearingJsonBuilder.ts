import _ from "lodash";

import {
  HearingJsonInput,
  hearingJsonSchema,
} from "@/schema/hearingJson/hearingJsonSchema";
import { hearingJsonSkeleton } from "@/schema/hearingJson/hearingJsonSkeleton";
import { InterpretedDataResponse } from "@/services/hearing/schema/interpretedDataSchema";

import {
  getHearingJsonPath,
  normalizeQuestionId,
  QUESTION_MAPPING,
} from "./questionMapping";

/**
 * ヒアリングJSON構築
 *
 * @param calculatedData - フォームからの直接データ
 * @param interpretedResults - interpreted-data API結果の配列
 * @returns 完全なヒアリングJSON
 */
export function buildHearingJson(
  calculatedData: HearingJsonInput,
  interpretedResults: InterpretedDataResponse[],
): HearingJsonInput {
  // スケルトン（空の構造）をベースに、calculatedDataをマージ
  // これにより、必須フィールドが欠けることなく、ダミーデータも混入しない
  const hearingJson = _.merge(
    _.cloneDeep(hearingJsonSkeleton),
    _.cloneDeep(calculatedData),
  );

  console.log("[HearingJsonBuilder] Building hearing JSON...");
  console.log("[HearingJsonBuilder] Base data:", calculatedData);
  console.log(
    "[HearingJsonBuilder] Interpreted results count:",
    interpretedResults.length,
  );

  // 全てのinterpreted結果をマージ
  for (const result of interpretedResults) {
    mergeInterpretedData(hearingJson, result);
  }

  console.log("[HearingJsonBuilder] Final hearing JSON:", hearingJson);

  return hearingJson;
}

/**
 * 単一のinterpreted-data API結果をhearingJsonにマージ
 *
 * @param hearingJson - 構築中のhearingJson（直接変更される）
 * @param result - interpreted-data APIのレスポンス
 */
function mergeInterpretedData(
  hearingJson: HearingJsonInput,
  result: InterpretedDataResponse,
): void {
  const { structuredData } = result;

  console.log("[HearingJsonBuilder] Merging interpreted data:", {
    structuredData,
  });

  // structuredDataの各キー（例: "q016", "q017"）を処理
  for (const [questionId, value] of Object.entries(structuredData)) {
    // hearingJsonのパスを取得
    const path = getHearingJsonPath(questionId);

    if (!path) {
      console.warn(
        `[HearingJsonBuilder] No mapping found for question ID: ${questionId}`,
      );
      continue;
    }

    // 型変換を試みる
    const normalized = normalizeQuestionId(questionId);
    const mapping = QUESTION_MAPPING[normalized];
    let convertedValue = value;

    if (mapping) {
      try {
        if (mapping.type === "number" && typeof value === "string") {
          convertedValue = parseFloat(value);
        } else if (mapping.type === "boolean" && typeof value === "string") {
          convertedValue = value === "true" || value === "yes" || value === "1";
        }
      } catch (error) {
        console.warn(
          `[HearingJsonBuilder] Failed to convert value for ${questionId}:`,
          error,
        );
      }
    }

    // Lodashの_.setでパスに値を設定
    console.log(`[HearingJsonBuilder] Setting ${path} = ${convertedValue}`);
    _.set(hearingJson, path, convertedValue);
  }

  // 注意: estimationsはhearingJsonにマージしない
  // estimationsはAIの推論根拠であり、メタデータとして別途保存
}

/**
 * ヒアリングJSONをスキーマでバリデーション
 *
 * @param hearingJson - バリデーション対象
 * @returns バリデーション結果
 */
export function validateHearingJson(hearingJson: HearingJsonInput): {
  success: boolean;
  errors?: string[];
  data?: HearingJsonInput;
} {
  try {
    const validated = hearingJsonSchema.parse(hearingJson);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof Error) {
      console.error("[HearingJsonBuilder] Validation failed:", error);
      return {
        success: false,
        errors: [error.message],
      };
    }
    return {
      success: false,
      errors: ["Unknown validation error"],
    };
  }
}

/**
 * estimationsメタデータを抽出
 *
 * デバッグ、監査証跡、AIの信頼度表示に使用
 *
 * @param interpretedResults - interpreted-data API結果の配列
 * @returns マージされたestimations
 */
export function extractEstimations(
  interpretedResults: InterpretedDataResponse[],
): Record<string, { value: unknown; reasoning?: string }> {
  const allEstimations: Record<string, { value: unknown; reasoning?: string }> =
    {};

  for (const result of interpretedResults) {
    Object.assign(allEstimations, result.estimations);
  }

  return allEstimations;
}
