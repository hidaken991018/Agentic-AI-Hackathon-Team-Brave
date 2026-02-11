import _ from "lodash";

import { QuestionsData } from "@/schema/hearingFormSchema";

/**
 * 必須フィールドのみに初期値を設定したフォームデフォルト値を生成する
 *
 * 各質問の `defaultValue` プロパティから初期値を取得する。
 * - defaultValue が定義されている質問 → その値を設定
 * - field_array → 空配列 []
 * - それ以外 → undefined（フォームに含めない）
 */
export const generateInitialValues = (questionsData: QuestionsData) => {
  const defaults: Record<string, unknown> = {};

  questionsData.forEach((step) => {
    step.questions.forEach((q) => {
      if (q.type === "field_array") {
        _.set(defaults, q.id, []);
      } else if ("defaultValue" in q && q.defaultValue !== undefined) {
        _.set(defaults, q.id, q.defaultValue);
      }
    });
  });

  return defaults;
};
