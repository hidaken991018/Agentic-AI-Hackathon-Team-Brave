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

import { handleInternalError } from "@/libs/common/errorHandler";
import {
  addCorsHeaders,
  handlePreflight,
  withAuth,
} from "@/middleware/authMiddleware";
import { handleAdditionalQuestions } from "@/usecases/hearing/agents/additionalQuestionsHandler";

export const runtime = "nodejs";

/** リクエストタイムアウト: 30秒 */
const REQUEST_TIMEOUT_MS = 30000;

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
  const startTime = Date.now();
  const origin = request.headers.get("origin");

  try {
    // 1. 認証チェック
    const authResult = await withAuth(request);
    if (!authResult.authenticated) {
      return addCorsHeaders(authResult.response, origin);
    }

    // 2. タイムアウト付きでリクエストボディを解析
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Request timeout")),
        REQUEST_TIMEOUT_MS,
      );
    });

    const bodyPromise = request.json();
    const requestBody = await Promise.race([bodyPromise, timeoutPromise]);

    // 3. ビジネスロジックを実行
    const result = await handleAdditionalQuestions(requestBody);

    // 4. レスポンス時間をログ出力
    const responseTime = Date.now() - startTime;
    console.log(`[AdditionalQuestionsAPI] レスポンス時間: ${responseTime}ms`);

    // 5. CORSヘッダー付きでレスポンスを返却
    return addCorsHeaders(result.response, origin);
  } catch (error) {
    // タイムアウトエラーの処理
    if (error instanceof Error && error.message === "Request timeout") {
      const response = handleInternalError(
        `リクエストタイムアウト（${REQUEST_TIMEOUT_MS / 1000}秒を超過しました）`,
      );
      return addCorsHeaders(response, origin);
    }

    // JSONパースエラーの処理
    if (error instanceof SyntaxError) {
      const response = handleInternalError("リクエストボディのJSONが不正です");
      return addCorsHeaders(response, origin);
    }

    // その他のエラーの処理
    const response = handleInternalError(error);
    return addCorsHeaders(response, origin);
  }
}
