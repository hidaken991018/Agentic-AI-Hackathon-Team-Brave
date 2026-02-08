/**
 * エラースキーマ定義
 *
 * Hearing API 全体で使用する統一エラーレスポンス形式を定義します。
 *
 * @module errorSchema
 */

import { z } from "zod";

/**
 * Hearing API 全体で使用するエラーコード定義
 *
 * - INVALID_REQUEST: 不正なリクエスト
 * - VALIDATION_ERROR: バリデーションエラー
 * - INVALID_SESSION: 無効なセッション
 * - SESSION_EXPIRED: セッション期限切れ
 * - UNAUTHORIZED: 認証エラー
 * - AGENT_ERROR: Agent Engine エラー
 * - GEMINI_ERROR: Gemini API エラー
 * - SERVICE_UNAVAILABLE: サービス利用不可
 * - INTERNAL_ERROR: 内部エラー
 */
export const ErrorCode = {
  INVALID_REQUEST: "INVALID_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_SESSION: "INVALID_SESSION",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  UNAUTHORIZED: "UNAUTHORIZED",
  AGENT_ERROR: "AGENT_ERROR",
  GEMINI_ERROR: "GEMINI_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * エラーレスポンスの Zod スキーマ
 *
 * - id: エラー追跡用 UUID
 * - code: エラーコード
 * - message: ユーザー向けエラーメッセージ
 * - details: 詳細情報（開発用、本番では省略可）
 */
export const errorResponseSchema = z.object({
  error: z.object({
    /** エラー追跡用 UUID */
    id: z.string().uuid(),
    /** エラーコード */
    code: z.enum([
      "INVALID_REQUEST",
      "VALIDATION_ERROR",
      "INVALID_SESSION",
      "SESSION_EXPIRED",
      "UNAUTHORIZED",
      "AGENT_ERROR",
      "GEMINI_ERROR",
      "SERVICE_UNAVAILABLE",
      "INTERNAL_ERROR",
    ]),
    /** ユーザー向けエラーメッセージ */
    message: z.string(),
    /** 詳細情報（開発用） */
    details: z.unknown().optional(),
  }),
});

/** エラーレスポンス型 */
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/**
 * エラーコードと HTTP ステータスコードのマッピング
 *
 * - 400系: クライアントエラー
 * - 500系: サーバーエラー
 */
export const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  INVALID_REQUEST: 400,
  VALIDATION_ERROR: 400,
  INVALID_SESSION: 400,
  SESSION_EXPIRED: 400,
  UNAUTHORIZED: 401,
  AGENT_ERROR: 503,
  GEMINI_ERROR: 503,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};
