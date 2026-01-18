/**
 * エラーハンドリングユーティリティ
 *
 * Hearing API 全体で使用する統一エラーレスポンス生成機能を提供します。
 * エラー ID（UUID）の自動生成とサーバーログ記録を含みます。
 *
 * @module errorHandler
 */

import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import {
  ERROR_STATUS_MAP,
  ErrorCode,
  type ErrorResponse,
} from "@/services/hearing/schema/errorSchema";

import type { z } from "zod";

/**
 * API エラー作成オプション
 */
interface CreateErrorOptions {
  /** エラーコード */
  code: ErrorCode;
  /** ユーザー向けエラーメッセージ */
  message: string;
  /** 詳細情報（開発用） */
  details?: unknown;
}

/**
 * 標準化されたエラーレスポンスオブジェクトを作成
 *
 * エラー ID（UUID）を自動生成し、サーバーログに記録します。
 *
 * @param options - エラー作成オプション
 * @returns エラーレスポンスオブジェクト
 */
export function createErrorResponse(
  options: CreateErrorOptions,
): ErrorResponse {
  const errorId = randomUUID();

  // サーバーサイドのトラブルシューティング用にログ記録
  console.error(`[ERROR] ${errorId}:`, {
    code: options.code,
    message: options.message,
    details: options.details,
    timestamp: new Date().toISOString(),
  });

  return {
    error: {
      id: errorId,
      code: options.code,
      message: options.message,
      ...(options.details !== undefined && { details: options.details }),
    },
  };
}

/**
 * 適切な HTTP ステータスコードとエラーボディを持つ NextResponse を作成
 *
 * @param options - エラー作成オプション
 * @returns エラーレスポンスを含む NextResponse
 */
export function createErrorNextResponse(
  options: CreateErrorOptions,
): NextResponse<ErrorResponse> {
  const errorResponse = createErrorResponse(options);
  const status = ERROR_STATUS_MAP[options.code];

  return NextResponse.json(errorResponse, { status });
}

/**
 * Zod バリデーションエラーを処理
 *
 * バリデーションエラーの詳細（パスとメッセージ）を含むレスポンスを返却します。
 *
 * @param zodError - Zod のエラーオブジェクト
 * @returns HTTP 400 エラーレスポンス
 */
export function handleValidationError(
  zodError: z.core.$ZodError,
): NextResponse<ErrorResponse> {
  const issues = zodError.issues;
  return createErrorNextResponse({
    code: ErrorCode.VALIDATION_ERROR,
    message: "リクエストのバリデーションに失敗しました",
    details: issues.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    })),
  });
}

/**
 * セッション関連のエラーを処理
 *
 * @param errorType - エラータイプ（"not_found" または "expired"）
 * @returns HTTP 400 エラーレスポンス
 */
export function handleSessionError(
  errorType: "not_found" | "expired",
): NextResponse<ErrorResponse> {
  const code =
    errorType === "expired"
      ? ErrorCode.SESSION_EXPIRED
      : ErrorCode.INVALID_SESSION;
  const message =
    errorType === "expired"
      ? "セッションの有効期限が切れています"
      : "セッションが見つかりません";

  return createErrorNextResponse({ code, message });
}

/**
 * 認証エラーを処理
 *
 * @returns HTTP 401 エラーレスポンス
 */
export function handleAuthError(): NextResponse<ErrorResponse> {
  return createErrorNextResponse({
    code: ErrorCode.UNAUTHORIZED,
    message: "認証に失敗しました。トークンが無効または期限切れです",
  });
}

/**
 * 外部サービスエラーを処理（Agent Engine、Gemini）
 *
 * 開発環境では元のエラー詳細を含めます。
 *
 * @param service - サービス種別（"agent" または "gemini"）
 * @param originalError - 元のエラーオブジェクト（オプション）
 * @returns HTTP 503 エラーレスポンス
 */
export function handleServiceError(
  service: "agent" | "gemini",
  originalError?: unknown,
): NextResponse<ErrorResponse> {
  const code =
    service === "agent" ? ErrorCode.AGENT_ERROR : ErrorCode.GEMINI_ERROR;
  const message =
    service === "agent"
      ? "Agent Engine との通信に失敗しました"
      : "Gemini API との通信に失敗しました";

  return createErrorNextResponse({
    code,
    message,
    details:
      process.env.NODE_ENV === "development" && originalError
        ? String(originalError)
        : undefined,
  });
}

/**
 * 予期しない内部エラーを処理
 *
 * 開発環境では元のエラー詳細を含めます。
 *
 * @param originalError - 元のエラーオブジェクト（オプション）
 * @returns HTTP 500 エラーレスポンス
 */
export function handleInternalError(
  originalError?: unknown,
): NextResponse<ErrorResponse> {
  return createErrorNextResponse({
    code: ErrorCode.INTERNAL_ERROR,
    message: "内部エラーが発生しました",
    details:
      process.env.NODE_ENV === "development" && originalError
        ? String(originalError)
        : undefined,
  });
}
