/**
 * 追加質問 API スキーマ定義
 *
 * データの整合性チェックと追加質問生成の
 * リクエスト/レスポンス形式を定義します。
 *
 * @module additionalQuestionsSchema
 */

import { z } from "zod";

/**
 * 追加質問 API リクエストスキーマ
 *
 * @property sessionId - セッション ID（必須、UUID v4）
 * @property questionCount - 現在の質問ラウンド数（0-3、デフォルト0）
 */
export const additionalQuestionsRequestSchema = z.object({
  /** セッション ID（必須） */
  sessionId: z.string().uuid(),
  /** 現在の質問ラウンド数（フロントエンド側で管理） */
  questionCount: z.number().int().min(0).max(3).default(0),
});

/** 追加質問 API リクエスト型 */
export type AdditionalQuestionsRequest = z.infer<
  typeof additionalQuestionsRequestSchema
>;

/**
 * 回答数タイプ
 * - single: 単一選択
 * - multiple: 複数選択
 */
export const answerCountSchema = z.enum(["single", "multiple"]);

/** 回答数型 */
export type AnswerCount = z.infer<typeof answerCountSchema>;

/**
 * 回答形式タイプ
 * - radio: ラジオボタン（単一選択用）
 * - pulldown: プルダウン（複数選択用）
 * - numeric: 数値入力
 * - short_text: 短文入力（AI 解釈要）
 * - long_text: 長文入力（AI 解釈要）
 */
export const answerFormatSchema = z.enum([
  "radio", // ラジオボタン（単一選択用）
  "pulldown", // プルダウン（複数選択用）
  "numeric", // 数値入力
  "short_text", // 短文入力
  "long_text", // 長文入力（段落）
]);

/** 回答形式型 */
export type AnswerFormat = z.infer<typeof answerFormatSchema>;

/**
 * 回答方法スキーマ
 *
 * 質問に対する回答方法を定義します。
 *
 * @property answerCount - 回答数（単一 or 複数）
 * @property answerFormat - 回答形式
 * @property requiresAiInterpretation - AI 解釈要否（true: interpreted-data API、false: direct-data API）
 * @property options - 選択肢（radio/pulldown の場合）
 */
export const answerMethodSchema = z.object({
  /** 回答数: 単一 or 複数 */
  answerCount: answerCountSchema,
  /** 回答形式 */
  answerFormat: answerFormatSchema,
  /** AI 解釈が必要か（true: interpreted-data API へ、false: direct-data API へ） */
  requiresAiInterpretation: z.boolean(),
  /** 選択肢（radio/pulldown 形式の場合） */
  options: z.array(z.string()).optional(),
});

/** 回答方法型 */
export type AnswerMethod = z.infer<typeof answerMethodSchema>;

/**
 * 質問スキーマ
 *
 * @property id - 質問 ID（UUID v4）
 * @property text - 質問文
 * @property answerMethod - 回答方法
 */
export const questionSchema = z.object({
  /** 質問 ID（UUID v4） */
  id: z.string().uuid(),
  /** 質問文 */
  text: z.string(),
  /** 回答方法 */
  answerMethod: answerMethodSchema,
});

/** 質問型 */
export type Question = z.infer<typeof questionSchema>;

/**
 * 追加質問ありレスポンススキーマ
 *
 * データが不足または不整合がある場合に返却されます。
 *
 * @property status - 常に "additional_questions_required"
 * @property questions - 生成された追加質問のリスト
 * @property questionCount - 現在の質問ラウンド（1-3）
 */
export const additionalQuestionsRequiredResponseSchema = z.object({
  /** ステータス: 追加質問あり */
  status: z.literal("additional_questions_required"),
  /** 追加質問リスト */
  questions: z.array(questionSchema),
  /** 現在の質問ラウンド（1-3） */
  questionCount: z.number().int().min(1).max(3),
});

/** 追加質問ありレスポンス型 */
export type AdditionalQuestionsRequiredResponse = z.infer<
  typeof additionalQuestionsRequiredResponseSchema
>;

/**
 * ヒアリング完了レスポンススキーマ
 *
 * データが充足し整合性がある場合、または最大質問回数に達した場合に返却されます。
 *
 * @property status - 常に "hearing_completed"
 * @property questionCount - 実行した質問ラウンド数
 */
export const hearingCompletedResponseSchema = z.object({
  /** ステータス: ヒアリング完了 */
  status: z.literal("hearing_completed"),
  /** 実行した質問ラウンド数 */
  questionCount: z.number().int().min(0),
});

/** ヒアリング完了レスポンス型 */
export type HearingCompletedResponse = z.infer<
  typeof hearingCompletedResponseSchema
>;

/**
 * 追加質問 API レスポンススキーマ（ユニオン型）
 *
 * - additional_questions_required: 追加質問あり
 * - hearing_completed: ヒアリング完了
 */
export const additionalQuestionsResponseSchema = z.discriminatedUnion(
  "status",
  [additionalQuestionsRequiredResponseSchema, hearingCompletedResponseSchema],
);

/** 追加質問 API レスポンス型 */
export type AdditionalQuestionsResponse = z.infer<
  typeof additionalQuestionsResponseSchema
>;
