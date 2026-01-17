/**
 * 解釈データ登録エンドポイント
 *
 * AIによる解釈が必要なデータを処理し、セッションに保存します。
 *
 * @module interpretedData
 */

import { NextRequest, NextResponse } from "next/server";

import { handleInternalError } from "@/libs/common/errorHandler";
import {
  addCorsHeaders,
  handlePreflight,
  withAuth,
} from "@/middleware/authMiddleware";
import { handleInterpretedData } from "@/usecases/hearing/agents/interpretedDataHandler";

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
 * 解釈データを登録するPOSTエンドポイント
 *
 * AIによる解釈が必要なデータを処理し、セッションに保存します。
 * 例: 資産運用の目標、リスク許容度の評価、ライフスタイルの希望
 *
 * リクエストボディ:
 * - sessionId: string（必須）- 有効なセッションUUID
 * - content: string（必須）- 解釈するユーザー入力内容（最大5000文字）
 * - estimationTargets: string[]（任意）- 直接提供されない場合に推定する項目
 * - outputSchema: JsonSchema（必須）- 構造化出力のスキーマ
 *
 * レスポンス:
 * - success: boolean - 処理成功フラグ
 * - sessionId: string - セッションID
 * - structuredData: Record<string, unknown> - 解析された構造化データ
 * - estimations: Record<string, Estimation> - 推定値と推論根拠
 * - processedAt: string（ISO 8601形式）- 処理日時
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
    const result = await handleInterpretedData(requestBody);

    // 4. レスポンス時間をログ出力
    const responseTime = Date.now() - startTime;
    console.log(`[InterpretedDataAPI] レスポンス時間: ${responseTime}ms`);

    // 5. CORSヘッダー付きでレスポンスを返却
    return addCorsHeaders(result.response, origin);
  } catch (error) {
    // エラーとレスポンス時間をログ出力
    const responseTime = Date.now() - startTime;
    console.error(
      `[InterpretedDataAPI] ${responseTime}ms後にエラー発生:`,
      error,
    );

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
