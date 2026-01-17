/**
 * 直接データハンドラー
 *
 * ユーザーから直接入力されたデータを受け取り、セッションに保存するためのハンドラーモジュール。
 * 新規セッションの作成または既存セッションの検証を行い、データをAgent Engine Sessionsに格納する。
 *
 * @module directDataHandler
 */

import { NextResponse } from "next/server";

import {
  createErrorNextResponse,
  handleServiceError,
  handleSessionError,
  handleValidationError,
} from "@/libs/common/errorHandler";
import { withRetry } from "@/libs/common/retryUtility";
import {
  createSession,
  updateSessionData,
  validateSession,
} from "@/libs/google/sessionManager";
import {
  directDataRequestSchema,
  directDataResponseSchema,
  type DirectDataRequest,
  type DirectDataResponse,
} from "@/usecases/hearing/schema/directDataSchema";
import { ErrorCode } from "@/usecases/hearing/schema/errorSchema";

/**
 * ハンドラー操作の結果型
 *
 * 成功時はDirectDataResponseを含むNextResponse、失敗時はエラーレスポンスを返す
 */
type HandlerResult =
  | { success: true; response: NextResponse<DirectDataResponse> }
  | { success: false; response: NextResponse };

/**
 * 直接データ受信のビジネスロジックを処理する
 *
 * 処理フロー:
 * 1. Zodスキーマでリクエストボディを検証
 * 2. sessionIdが指定されていない場合は新規セッションを作成、指定されている場合は既存セッションを検証
 * 3. リトライ機能付きでAgent Engine Sessionsに直接データを保存
 * 4. sessionIdとタイムスタンプを含む成功レスポンスを返却
 *
 * @param requestBody - 検証前のリクエストボディ
 * @returns ハンドラー処理結果（成功/失敗とレスポンス）
 */
export async function handleDirectData(
  requestBody: unknown,
): Promise<HandlerResult> {
  // 1. リクエストボディの検証
  const parseResult = directDataRequestSchema.safeParse(requestBody);
  if (!parseResult.success) {
    return {
      success: false,
      response: handleValidationError(parseResult.error),
    };
  }

  const request: DirectDataRequest = parseResult.data;

  // 2. セッション処理: 新規作成または既存の検証
  let sessionId: string;

  if (request.sessionId) {
    // 既存セッションの検証
    const validationResult = await validateSession(request.sessionId);
    if (!validationResult.ok) {
      const errorType =
        validationResult.error.code === "SESSION_EXPIRED"
          ? "expired"
          : "not_found";
      return {
        success: false,
        response: handleSessionError(errorType),
      };
    }
    sessionId = validationResult.value.id;
  } else {
    // 新規セッションの作成
    const createResult = await createSession();
    if (!createResult.ok) {
      return {
        success: false,
        response: createErrorNextResponse({
          code: ErrorCode.SERVICE_UNAVAILABLE,
          message: "セッションの作成に失敗しました",
          details: createResult.error.message,
        }),
      };
    }
    sessionId = createResult.value;
  }

  // 3. リトライ機能付きでセッションに直接データを保存
  const storeResult = await withRetry(
    async () => {
      const result = await updateSessionData(sessionId, request.data);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      return result.value;
    },
    { maxRetries: 2, initialDelayMs: 1000, backoffMultiplier: 2 },
  );

  if (!storeResult.ok) {
    return {
      success: false,
      response: handleServiceError("agent", storeResult.error.lastError),
    };
  }

  // 4. 成功レスポンスの構築
  const storedAt = new Date().toISOString();
  const responseData: DirectDataResponse = {
    success: true,
    sessionId,
    storedAt,
  };

  // レスポンスの検証（型安全性のため）
  const responseValidation = directDataResponseSchema.safeParse(responseData);
  if (!responseValidation.success) {
    console.error(
      "[DirectDataHandler] レスポンス検証に失敗しました:",
      responseValidation.error,
    );
    return {
      success: false,
      response: createErrorNextResponse({
        code: ErrorCode.INTERNAL_ERROR,
        message: "レスポンスの生成に失敗しました",
      }),
    };
  }

  return {
    success: true,
    response: NextResponse.json(responseValidation.data, { status: 200 }),
  };
}
