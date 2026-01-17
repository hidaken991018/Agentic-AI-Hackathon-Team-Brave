/**
 * 直接データ API スキーマ定義
 *
 * AI 解釈不要なデータ（年収、貯蓄額、年齢など）の
 * リクエスト/レスポンス形式を定義します。
 *
 * @module directDataSchema
 */

import { z } from "zod";

/**
 * 値をサニタイズする関数
 *
 * 文字列の前後空白をトリムし、潜在的に危険な文字（null バイト等）を除去します。
 * XSS/SQL インジェクション対策の一環として使用。
 *
 * @param value - サニタイズ対象の値
 * @returns サニタイズ済みの値
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    // 空白をトリムし、null バイトを除去
    return value.trim().replace(/\0/g, "");
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sanitizeValue(v)]),
    );
  }
  return value;
}

/**
 * データオブジェクトの Zod スキーマ（サニタイズ処理付き）
 *
 * 任意のキー・バリューペアを受け付け、文字列値をサニタイズします。
 * 空オブジェクトは拒否されます。
 */
const dataObjectSchema = z
  .record(z.string(), z.unknown())
  .refine((data) => Object.keys(data).length > 0, {
    message: "データオブジェクトは空にできません",
  })
  .transform((data) => sanitizeValue(data) as Record<string, unknown>);

/**
 * 直接データ API リクエストスキーマ
 *
 * @property sessionId - セッション ID（UUID v4、省略時は新規作成）
 * @property data - 保存する直接データ（キー・バリュー形式）
 */
export const directDataRequestSchema = z.object({
  /** セッション ID（省略時は新規セッションを作成） */
  sessionId: z.string().uuid().optional(),
  /** 保存する直接データ */
  data: dataObjectSchema,
});

/**
 * 直接データ API レスポンススキーマ
 *
 * @property success - 成功フラグ（常に true）
 * @property sessionId - セッション ID（UUID v4）
 * @property storedAt - データ保存日時（ISO 8601）
 */
export const directDataResponseSchema = z.object({
  /** 成功フラグ */
  success: z.literal(true),
  /** セッション ID */
  sessionId: z.string().uuid(),
  /** データ保存日時 */
  storedAt: z.string().datetime({ offset: true }),
});

/** 直接データ API リクエスト型 */
export type DirectDataRequest = z.infer<typeof directDataRequestSchema>;

/** 直接データ API レスポンス型 */
export type DirectDataResponse = z.infer<typeof directDataResponseSchema>;
