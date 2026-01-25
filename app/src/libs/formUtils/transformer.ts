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

            if (
              subMapping &&
              subValue !== undefined &&
              subValue !== null &&
              subValue !== ""
            ) {
              const finalSubValue =
                subField.type === "number" ? Number(subValue) : subValue;

              _.set(obj, subMapping, finalSubValue);
            }
          });
          return obj;
        });

        _.set(quantitativePayload, mapping, transformedArray);
      }

      // B. 通常の質問
      else {
        if (rawValue !== undefined && rawValue !== null && rawValue !== "") {
          const finalValue = q.type === "number" ? Number(rawValue) : rawValue;

          // Lodash の _.set でセット
          _.set(quantitativePayload, mapping, finalValue);
        }
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
