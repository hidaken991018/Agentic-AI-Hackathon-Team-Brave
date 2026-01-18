/**
 * 解釈データ登録エンドポイント
 *
 * AIによる解釈が必要なデータを処理し、セッションに保存します。
 *
 * @module interpretedData
 */

import { NextRequest, NextResponse } from "next/server";

import {
  handleInternalError,
  handleValidationError,
} from "@/libs/common/errorHandler";
import {
  addCorsHeaders,
  handlePreflight,
  withAuth,
} from "@/middleware/authMiddleware";
import { handleInterpretedData } from "@/usecases/hearing/agents/interpretedDataHandler";
import { interpretedDataRequestSchema } from "@/usecases/hearing/schema/interpretedDataSchema";

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
  const parseResult = interpretedDataRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const response = handleValidationError(parseResult.error);
    return addCorsHeaders(response, origin);
  }

  // 4. ビジネスロジックを実行
  const result = await handleInterpretedData(parseResult.data);

  // 5. CORSヘッダー付きでレスポンスを返却
  return addCorsHeaders(result.response, origin);
}
