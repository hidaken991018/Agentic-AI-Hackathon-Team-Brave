import { Question } from "@/schema/hearingFormSchema";

// 入力データの基本単位
type PrimitiveValue = string | number | boolean | null;

// field_array内の1行分のデータ（例: { "q06": "田中", "q07": "2020" }）
type FieldRowData = Record<string, PrimitiveValue>;

// フォーム全体のデータ（q01: string, children_group: FieldRowData[] など）
type FormData = Record<string, PrimitiveValue | FieldRowData[] | unknown>;

/**
 * フォーム回答から「計算用JSON」と「AI用定性リスト」を同時に生成する
 */
export const transformToApiPayload = (
  formData: FormData,
  questionsData: any,
) => {
  // 1. 計算用構造体（定量データ）の初期化
  const quantitativePayload = {
    meta: {
      hearingVersion: 2,
      answeredAt: new Date().toISOString(),
      currency: "万円",
    },
  };

  // 2. AIアドバイス用の一覧（定性データ）
  const qualitativeList: {
    label: string;
    answer: PrimitiveValue;
    related: string[];
  }[] = [];

  // 定性データをリストに追加する補助関数
  const addQualitative = (
    q: Question,
    value: PrimitiveValue | FieldRowData[],
    prefix: string = "",
  ) => {
    if (
      q.purpose === "qualitative" &&
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      qualitativeList.push({
        label: prefix ? `${prefix}: ${q.label}` : q.label,
        answer: value as PrimitiveValue,
        related: q.related || [],
      });
    }
  };

  questionsData.forEach((step) => {
    step.questions.forEach((q: Question) => {
      const rawValue = formData[q.id];

      // --- 定性データの処理 ---
      addQualitative(q, rawValue);

      // --- 定量データのマッピング処理 ---
      if (!q.mapping) return;

      // A. 通常の質問
      if (q.type !== "field_array") {
        if (rawValue !== undefined && rawValue !== null && rawValue !== "") {
          const finalValue = q.type === "number" ? Number(rawValue) : rawValue;
          setDeep(quantitativePayload, q.mapping, finalValue);
        }
      }

      // B. field_array（配列データ）
      else if (q.type === "field_array") {
        const formArray = (rawValue as FieldRowData[]) || [];

        const transformedArray = formArray.map((item, index) => {
          const obj: FieldRowData = {};

          q.fields?.forEach((subField: Question) => {
            const subValue = item[subField.id];

            // 配列内の定性データを収集（例：「1件目の子どもの名前」）
            addQualitative(subField, subValue, `${q.label}(${index + 1}件目)`);

            // 配列内の定量データをマッピング
            if (
              subField.mapping &&
              subValue !== undefined &&
              subValue !== null &&
              subValue !== ""
            ) {
              const finalSubValue =
                subField.type === "number" ? Number(subValue) : subValue;
              setDeep(obj, subField.mapping, finalSubValue);
            }
          });
          return obj;
        });

        setDeep(quantitativePayload, q.mapping, transformedArray);
      }
    });
  });

  return {
    calculatedData: quantitativePayload, // 計算エンジンへ
    aiContext: qualitativeList, // LLMのプロンプトへ
  };
};

/**
 * オブジェクトの指定したパスに値をセットする (lodash.set の代替)
 * 例: setDeep({}, "user.profile.name", "田中")
 * => { user: { profile: { name: "田中" } } }
 * @description 任意の深さのネストに対応するため、型を any にしています
 */
export const setDeep = (obj: any, path: string, value: any) => {
  const keys = path.split(".");
  let current = obj;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
    } else {
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
  });
  return obj;
};

export const generateDefaultValues = (questionsData: any) => {
  const defaults: Record<string, string | number | boolean | null | string[]> =
    {};

  questionsData.forEach((step) => {
    step.questions.forEach((q: Question) => {
      if (q.type === "field_array") {
        // field_array の場合は必ず空配列 [] をセット
        defaults[q.id] = [];
      } else if (q.type === "number") {
        // 数値型は 0 か ""（スキーマのpreprocessで処理可能なら ""）
        defaults[q.id] = "";
      } else if (q.type === "radio" || q.type === "select") {
        // 選択系は空文字
        defaults[q.id] = "";
      } else {
        defaults[q.id] = "";
      }
    });
  });

  return defaults;
};
