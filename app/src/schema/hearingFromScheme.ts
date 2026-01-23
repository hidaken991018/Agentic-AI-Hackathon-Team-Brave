// 質問の選択肢
export type QuestionOption = {
  label: string;
  value: string;
};

// フォームで扱う可能性のあるプリミティブ値に限定
export type FieldValue = string | number | boolean | null;

// 質問の型定義
export type Question = {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "radio" | "textarea" | "field_array";
  required?: boolean;
  options?: QuestionOption[] | string; // 文字列の場合は "year_range" などのキーワード
  mapping?: string; // Zodスキーマへのパス
  condition?: {
    field: string;
    operator: "===" | "!==";
    value: FieldValue | FieldValue[];
  };
  // field_array の場合のみ、その中の質問リストを持つ
  fields?: Question[];
  purpose?: "quantitative" | "qualitative";
  related?: string[];
};

// ステップの型定義
export type Step = {
  step: number;
  stepTitle: string;
  questions: Question[];
};
