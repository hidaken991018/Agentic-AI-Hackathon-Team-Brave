/**
 * 解釈データ API スキーマ定義
 *
 * AI 解釈が必要なデータ（自由記述、価値観、感情など）の
 * リクエスト/レスポンス形式を定義します。
 *
 * @module interpretedDataSchema
 */

import { z } from "zod";

/**
 * コンテンツの最大文字数制限
 */
export const MAX_CONTENT_LENGTH = 5000;

/**
 * JSON Schema プロパティ定義のスキーマ
 */
export const jsonSchemaPropertySchema = z.object({
  /** プロパティの型 */
  type: z.string(),
  /** プロパティの説明（オプション） */
  description: z.string().optional(),
});

/** JSON Schema プロパティ型 */
export type JsonSchemaProperty = z.infer<typeof jsonSchemaPropertySchema>;

/**
 * outputSchema の JSON Schema 形式検証スキーマ
 *
 * Gemini API に渡す構造化出力スキーマの形式を検証します。
 */
export const jsonSchemaSchema = z.object({
  /** 常に "object" */
  type: z.literal("object"),
  /** プロパティ定義 */
  properties: z.record(z.string(), jsonSchemaPropertySchema),
  /** 必須プロパティのリスト（オプション） */
  required: z.array(z.string()).optional(),
});

/** JSON Schema 型 */
export type JsonSchema = z.infer<typeof jsonSchemaSchema>;

/**
 * 解釈データ API リクエストスキーマ
 *
 * @property userId - ユーザー ID（必須）
 * @property sessionId - セッション ID（必須、UUID v4）
 * @property content - 自由記述テキスト（最大5000文字）
 * @property estimationTargets - 推定対象項目（必須、1つ以上）
 * @property outputSchema - Gemini 構造化出力スキーマ（必須）
 */
export const interpretedDataRequestSchema = z.object({
  /** ユーザー ID（必須） */
  userId: z.string().min(1, { message: "userId は必須です" }),
  /** セッション ID（必須） */
  sessionId: z.string().uuid({ message: "sessionId は有効な UUID v4 である必要があります" }),
  /** 自由記述テキスト */
  content: z
    .string()
    .min(1, { message: "content は必須です" })
    .max(MAX_CONTENT_LENGTH, {
      message: `content は ${MAX_CONTENT_LENGTH} 文字以内である必要があります`,
    }),
  /** 推定対象項目（必須、1つ以上） */
  estimationTargets: z.array(z.string()).min(1, {
    message: "estimationTargets は少なくとも1つ以上必要です",
  }),
  /** Gemini 構造化出力スキーマ */
  outputSchema: jsonSchemaSchema,
});

/** 解釈データ API リクエスト型 */
export type InterpretedDataRequest = z.infer<
  typeof interpretedDataRequestSchema
>;

/**
 * 推定結果のスキーマ
 *
 * @property value - 推定値（数値または文字列）
 * @property reasoning - 推定根拠（オプション）
 */
export const estimationSchema = z.object({
  /** 推定値 */
  value: z.union([z.number(), z.string()]),
  /** 推定根拠 */
  reasoning: z.string().optional(),
});

/** 推定結果型 */
export type Estimation = z.infer<typeof estimationSchema>;

/**
 * 解釈データ API レスポンススキーマ
 *
 * @property success - 成功フラグ（常に true）
 * @property sessionId - セッション ID
 * @property structuredData - outputSchema に準拠した構造化データ
 * @property estimations - 推定対象項目ごとの推定結果
 * @property processedAt - 処理日時（ISO 8601）
 */
export const interpretedDataResponseSchema = z.object({
  /** 成功フラグ */
  success: z.literal(true),
  /** セッション ID */
  sessionId: z.string().uuid(),
  /** 構造化データ（outputSchema 準拠） */
  structuredData: z.record(z.string(), z.unknown()),
  /** 推定結果 */
  estimations: z.record(z.string(), estimationSchema),
  /** 処理日時 */
  processedAt: z.string().datetime({ message: "processedAt は ISO 8601 形式である必要があります" }),
});

/** 解釈データ API レスポンス型 */
export type InterpretedDataResponse = z.infer<
  typeof interpretedDataResponseSchema
>;
