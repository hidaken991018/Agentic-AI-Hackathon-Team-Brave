import _ from "lodash"; // または import { get, set } from "lodash";

import { FlexibleQuestion, QuestionsData } from "@/schema/hearingFormSchema";
import { HearingJsonInput } from "@/schema/hearingJson/hearingJsonSchema";

// 入力データの型定義
export type LifePlanFormData = Record<
  string,
  string | string[] | number | undefined
>;

/**
 * フォーム回答から「計算用JSON」と「AI用定性リスト」を同時に生成する
 */
export const transformToApiPayload = (
  formData: LifePlanFormData,
  questionsData: QuestionsData,
) => {
  console.log("Transforming form data:", formData);
  // 1. 定量データ
  const quantitativePayload = {
    meta: {
      hearingVersion: 2,
      answeredAt: new Date().toISOString(),
      currency: "万円",
    },
  } as HearingJsonInput;

  // 2. AIアドバイス用の一覧（定性データ）
  const qualitativeList: {
    label: string;
    answer: string | number | string[] | undefined;
    related: string[];
  }[] = [];

  // 定性データをリストに追加する関数
  const addQualitative = (
    q: FlexibleQuestion,
    value: string | number | string[] | undefined,
    prefix: string = "",
  ) => {
    // プロパティが存在しない可能性があるので _.get で取得
    const purpose = _.get(q, "purpose");
    const related = _.get(q, "related", []);

    if (
      purpose === "qualitative" &&
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      qualitativeList.push({
        label: prefix ? `${prefix}: ${q.label}` : q.label,
        answer: value,
        related: [...related],
      });
    }
  };
  questionsData.forEach((step) => {
    step.questions.forEach((q) => {
      // Lodash の _.get を使用して値を取得
      const rawValue = _.get(formData, q.id);

      // --- 定性データの処理 ---
      addQualitative(q as FlexibleQuestion, rawValue);

      // --- 定量データのマッピング処理 ---

      // Lodash の _.get を使用して値を取得
      const mapping = _.get(q, "mapping");
      // mapping がない、または値が空の場合はスキップ
      if (!mapping) return;

      // --- A. field_array（配列データ） ---
      if (q.type === "field_array") {
        const formArray = (rawValue as string[]) || [];

        const transformedArray = formArray.map((item, index) => {
          const obj = {};

          // q.fields も存在しない可能性があるので _.get で安全に
          const fields = _.get(q, "fields", []);

          fields.forEach((subField: FlexibleQuestion) => {
            const subValue = _.get(item, subField.id);
            const subMapping = _.get(subField, "mapping");

            addQualitative(subField, subValue, `${q.label}(${index + 1}件目)`);

            // mapping がある場合は、空でもデフォルト値を設定
            if (subMapping) {
              // 型変換: type="number" または mapping に数値フィールド名が含まれる場合は数値に変換
              const mappingLower =
                typeof subMapping === "string" ? subMapping.toLowerCase() : "";
              const shouldConvertToNumber =
                subField.type === "number" ||
                (typeof subMapping === "string" &&
                  (mappingLower.includes("year") ||
                    mappingLower.includes("age") ||
                    mappingLower.includes("amount") ||
                    mappingLower.includes("rate") ||
                    mappingLower.includes("cost") ||
                    mappingLower.includes("ratio")));

              // 空の値の場合、デフォルト値を設定
              let finalSubValue;
              if (
                subValue === undefined ||
                subValue === null ||
                subValue === ""
              ) {
                finalSubValue = shouldConvertToNumber ? 0 : "";
              } else {
                finalSubValue = shouldConvertToNumber
                  ? Number(subValue)
                  : subValue;
              }

              // パーセント入力（suffix: "%"）を小数形式に変換（例: 2 → 0.02）
              const subSuffix = _.get(subField, "suffix");
              if (
                subSuffix === "%" &&
                typeof finalSubValue === "number" &&
                finalSubValue !== 0
              ) {
                finalSubValue = finalSubValue / 100;
              }

              _.set(obj, subMapping, finalSubValue);
            }
          });

          // スキーマで必須だがフォームに存在しないフィールドのデフォルト値を設定
          if (mapping === "expenses.insuranceList") {
            // annualFigures: 保険料の経年係数（デフォルト: 1.0 = 変化なし）
            if (!_.has(obj, "annualFigures")) {
              _.set(obj, "annualFigures", 1.0);
            }
          }

          if (mapping === "basicProfile.childList") {
            // 学校種別フィールドのデフォルト値を設定（未入力の場合は"NON"）
            const schoolTypeFields = [
              "preschoolersType",
              "primarySchoolType",
              "juniorHighSchoolType",
              "highSchoolType",
              "universityType",
              "graduateSchoolType",
            ];

            schoolTypeFields.forEach((field) => {
              if (!_.has(obj, field) || _.get(obj, field) === "") {
                _.set(obj, field, "NON");
              }
            });
          }

          return obj;
        });

        _.set(quantitativePayload, mapping, transformedArray);
      }

      // B. 通常の質問
      else {
        // 型変換: type="number" または mapping に数値フィールド名が含まれる場合は数値に変換
        const mappingLower =
          typeof mapping === "string" ? mapping.toLowerCase() : "";
        const shouldConvertToNumber =
          q.type === "number" ||
          (typeof mapping === "string" &&
            (mappingLower.includes("year") ||
              mappingLower.includes("age") ||
              mappingLower.includes("amount") ||
              mappingLower.includes("rate") ||
              mappingLower.includes("cost") ||
              mappingLower.includes("ratio")));

        // 空の値の場合、デフォルト値を設定（必須フィールドのバリデーションエラーを防ぐ）
        let finalValue;
        if (rawValue === undefined || rawValue === null || rawValue === "") {
          finalValue = shouldConvertToNumber ? 0 : "";
        } else {
          finalValue = shouldConvertToNumber ? Number(rawValue) : rawValue;
        }

        // パーセント入力（suffix: "%"）を小数形式に変換（例: 2 → 0.02）
        const suffix = _.get(q, "suffix");
        if (
          suffix === "%" &&
          typeof finalValue === "number" &&
          finalValue !== 0
        ) {
          finalValue = finalValue / 100;
        }

        // Lodash の _.set でセット
        _.set(quantitativePayload, mapping, finalValue);
      }
    });
  });

  return {
    calculatedData: quantitativePayload, // 計算エンジンへ
    aiContext: qualitativeList, // LLMのプロンプトへ
  };
};

/**
 * フォームの初期値を生成する (Lodash版)
 */
export const generateDefaultValues = (questionsData: QuestionsData) => {
  const defaults = {};

  questionsData.forEach((step) => {
    step.questions.forEach((q) => {
      if (q.type === "field_array") {
        _.set(defaults, q.id, []);
      } else {
        // number でも select でも、初期値は空文字 "" で統一
        _.set(defaults, q.id, "");
      }
    });
  });

  return defaults;
};

/**
 * FieldArray 内の件数ラベルを動的に生成する
 * @param parentQuestion - 親質問 (type: "field_array" のもの)
 * @param index - 配列のインデックス (0開始)
 * @returns 変換後のラベル文字列
 */
export const getDynamicArrayLabel = (
  parentQuestion: FlexibleQuestion,
  index: number,
): string => {
  const displayIndex = index + 1;

  // arrayLabelPrefix が設定されている場合 (例: "第{n}子")
  if (parentQuestion.arrayLabelPrefix) {
    const prefix = parentQuestion.arrayLabelPrefix.replace(
      "{n}",
      displayIndex.toString(),
    );
    return `${prefix}`;
  }

  // 設定がない場合のデフォルト形式 (例: "1件目: 氏名")
  return `${displayIndex}件目`;
};
