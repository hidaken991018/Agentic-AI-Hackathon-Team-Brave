import _ from "lodash";
import z from "zod";

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

  // 子供の配列の学校種別フィールドのバリデーション修正
  if (
    hearingJson.basicProfile?.childList &&
    Array.isArray(hearingJson.basicProfile.childList)
  ) {
    console.log("[HearingJsonBuilder] Validating childList school types...");

    hearingJson.basicProfile.childList = hearingJson.basicProfile.childList.map(
      (child, index) => {
        console.log(`[HearingJsonBuilder] Child ${index} before fix:`, child);

        const schoolTypeFields = [
          "preschoolersType",
          "primarySchoolType",
          "juniorHighSchoolType",
          "highSchoolType",
          "universityType",
          "graduateSchoolType",
        ] as const;

        schoolTypeFields.forEach((field) => {
          const currentValue = child[field];
          // 有効な値のリスト
          const validValues = ["NON", "PUB", "PVT"];

          // 値が存在しない、または有効な値でない場合は "NON" を設定
          if (
            currentValue === undefined ||
            currentValue === null ||
            !validValues.includes(currentValue as string)
          ) {
            console.log(
              `[HearingJsonBuilder] Setting ${field} to "NON" (was: ${currentValue})`,
            );
            child[field] = "NON";
          }
        });

        console.log(`[HearingJsonBuilder] Child ${index} after fix:`, child);
        return child;
      },
    );
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
  console.log(
    "[HearingJsonBuilder] structuredData entries:",
    Object.entries(structuredData),
  );
  console.log(
    "[HearingJsonBuilder] structuredData keys:",
    Object.keys(structuredData),
  );
  console.log(
    "[HearingJsonBuilder] Available QUESTION_MAPPING keys:",
    Object.keys(QUESTION_MAPPING),
  );

  for (const [questionId, value] of Object.entries(structuredData)) {
    // hearingJsonのパスを取得
    const normalized = normalizeQuestionId(questionId);
    const path = getHearingJsonPath(questionId);

    console.log(
      `[HearingJsonBuilder] Processing: questionId="${questionId}" -> normalized="${normalized}" -> path="${path}" | value=`,
      value,
      `(type: ${typeof value})`,
    );

    if (!path) {
      console.warn(
        `[HearingJsonBuilder] No mapping found for question ID: ${questionId} (normalized: ${normalized})`,
      );
      continue;
    }

    // 型変換を試みる
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
  } catch (error: unknown) {
    console.error("[HearingJsonBuilder] Validation failed:", error);

    // Zodエラーの場合、詳細な情報を抽出
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((issue) => {
        const path = issue.path.join(".");
        return `${path}: ${issue.message}`;
      });

      console.error("[HearingJsonBuilder] Validation errors:", errorMessages);

      return {
        success: false,
        errors: errorMessages,
      };
    }

    if (error instanceof Error) {
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
