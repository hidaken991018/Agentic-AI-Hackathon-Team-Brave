/**
 * 直接データ登録エンドポイント
 *
 * AIによる解釈が不要な直接データを受け取り、セッションに保存します。
 * 年収、貯蓄額、年齢、家族構成などの明確な数値・選択データが対象です。
 *
 * @module directData
 */

import { NextRequest, NextResponse } from "next/server";

import { handleInternalError } from "@/libs/common/errorHandler";
import {
  addCorsHeaders,
  handlePreflight,
  withAuth,
} from "@/middleware/authMiddleware";
import { handleDirectData } from "@/usecases/hearing/agents/directDataHandler";

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
 * 直接データを登録するPOSTエンドポイント
 *
 * AIによる解釈が不要な直接データを受け取り、セッションに保存します。
 * 例: 年収、貯蓄額、年齢、家族構成
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
    const result = await handleDirectData(requestBody);

    // 4. レスポンス時間をログ出力
    const responseTime = Date.now() - startTime;
    console.log(`[DirectDataAPI] レスポンス時間: ${responseTime}ms`);

    // 5. CORSヘッダー付きでレスポンスを返却
    return addCorsHeaders(result.response, origin);
  } catch (error) {
    // エラーとレスポンス時間をログ出力
    const responseTime = Date.now() - startTime;
    console.error(`[DirectDataAPI] ${responseTime}ms後にエラー発生:`, error);

    // タイムアウトエラーの処理
    if (error instanceof Error && error.message === "Request timeout") {
      const response = handleInternalError(
        "リクエストタイムアウト（30秒を超過しました）",
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
