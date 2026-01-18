/**
 * 追加質問生成エンドポイント
 *
 * セッションデータの整合性と充足度をチェックします。
 * 追加情報が必要な場合はフォローアップ質問を生成し、
 * データが完全な場合はヒアリング完了ステータスを返します。
 *
 * @module additionalQuestions
 */

import { NextRequest, NextResponse } from "next/server";

import {
  createErrorNextResponse,
  handleInternalError,
  handleServiceError,
  handleSessionError,
  handleValidationError,
} from "@/libs/common/errorHandler";
import {
  addCorsHeaders,
  handlePreflight,
  withAuth,
} from "@/middleware/authMiddleware";
import { handleAdditionalQuestions } from "@/services/hearing/agents/additionalQuestionsHandler";
import {
  additionalQuestionsRequestSchema,
  additionalQuestionsResponseSchema,
} from "@/services/hearing/schema/additionalQuestionsSchema";
import { ErrorCode } from "@/services/hearing/schema/errorSchema";

export const runtime = "nodejs";

/**
 * CORSプリフライトリクエストを処理します
 * @param request - プリフライトリクエストオブジェクト
 * @returns CORSヘッダー付きレスポンス
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return handlePreflight(request);
}

/**
 * 追加質問を生成するPOSTエンドポイント
 *
 * セッションデータの整合性と充足度をチェックします。
 * 追加情報が必要な場合はフォローアップ質問を生成し、
 * データが完全な場合はヒアリング完了ステータスを返します。
 *
 * リクエストボディ:
 * - sessionId: UUID - チェック対象のセッションID
 * - questionCount: number - 現在の質問ラウンド数（0〜3）
 *
 * レスポンス:
 * - status: "additional_questions_required" | "hearing_completed" - 処理ステータス
 * - questions: Question[] - 追加質問の配列（追加質問が必要な場合）
 * - questionCount: number - 更新された質問ラウンド数
 *
 * @param request - リクエストオブジェクト
 * @returns 処理結果を含むレスポンス
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get("origin");

  // 1. 認証チェック
  const authResult = await withAuth(request);
  if (!authResult.authenticated) {
    return addCorsHeaders(authResult.response, origin);
  }

  // 2. リクエストボディの解析
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    const response = handleInternalError("リクエストボディのJSONが不正です");
    return addCorsHeaders(response, origin);
  }

  // 3. リクエストボディのバリデーション
  const parseResult = additionalQuestionsRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const response = handleValidationError(parseResult.error);
    return addCorsHeaders(response, origin);
  }

  // 4. ビジネスロジックを実行
  const result = await handleAdditionalQuestions(parseResult.data);

  // 5. エラー処理
  if (!result.success) {
    let errorResponse: NextResponse;
    switch (result.error.type) {
      case "session":
        errorResponse = handleSessionError(result.error.errorType);
        break;
      case "agent":
        errorResponse = handleServiceError("agent", result.error.originalError);
        break;
      case "gemini":
        errorResponse = handleServiceError(
          "gemini",
          result.error.originalError,
        );
        break;
    }
    return addCorsHeaders(errorResponse, origin);
  }

  // 6. レスポンス検証
  const responseValidation = additionalQuestionsResponseSchema.safeParse(
    result.data,
  );
  if (!responseValidation.success) {
    console.error(
      "[AdditionalQuestions] レスポンス検証に失敗しました:",
      responseValidation.error,
    );
    const errorResponse = createErrorNextResponse({
      code: ErrorCode.INTERNAL_ERROR,
      message: "レスポンスの生成に失敗しました",
    });
    return addCorsHeaders(errorResponse, origin);
  }

  // 7. CORSヘッダー付きで成功レスポンスを返却
  return addCorsHeaders(
    NextResponse.json(responseValidation.data, { status: 200 }),
    origin,
  );
}
