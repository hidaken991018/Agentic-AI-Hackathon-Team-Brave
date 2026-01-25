import { CONSTS } from "@/consts";

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

// QUESTIONSから型を抽出
export type QuestionsData = typeof CONSTS.QUESTIONS;

// 配列の中身（各ステップ）の型
export type StepData = QuestionsData[number];

// 質問単体の型（再帰的な構造に対応するため、抽出ルールを定義）
export type QuestionData =
  | StepData["questions"][number]
  | (StepData["questions"][number] extends { fields: readonly QuestionData[] }
      ? StepData["questions"][number]["fields"][number]
      : never);

// 柔軟な質問型定義（DynamicFormField などで使用）
export interface FlexibleQuestion {
  id: string; // string リテラルではなく string 全般
  label: string; // 特定の一文ではなく string 全般
  type: string; // "text" | "number" ... などのリテラルではなく string
  required?: boolean;
  options?: string | readonly QuestionOption[];
  mapping?: string;
  condition?: {
    field: string;
    operator: string;
    value: FieldValue | FieldValue[];
  };
  fields?: FlexibleQuestion[]; // 再帰的な構造を許容
  purpose?: string;
  related?: readonly string[] | string[];
}
