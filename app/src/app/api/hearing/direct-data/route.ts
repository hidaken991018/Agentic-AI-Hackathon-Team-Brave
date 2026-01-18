/**
 * 直接データ登録エンドポイント
 *
 * AIによる解釈が不要な直接データを受け取り、セッションに保存します。
 * 年収、貯蓄額、年齢、家族構成などの明確な数値・選択データが対象です。
 *
 * @module directData
 */

import { NextRequest, NextResponse } from "next/server";

import {
  createErrorNextResponse,
  handleInternalError,
  handleSessionError,
  handleValidationError,
} from "@/libs/common/errorHandler";
import {
  addCorsHeaders,
  handlePreflight,
  withAuth,
} from "@/middleware/authMiddleware";
import { handleDirectData } from "@/usecases/hearing/agents/directDataHandler";
import {
  directDataRequestSchema,
  directDataResponseSchema,
} from "@/usecases/hearing/schema/directDataSchema";
import { ErrorCode } from "@/usecases/hearing/schema/errorSchema";

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
 * 直接データを登録するPOSTエンドポイント
 *
 * AIによる解釈が不要な直接データを受け取り、セッションに保存します。
 * 例: 年収、貯蓄額、年齢、家族構成
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
  const parseResult = directDataRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const response = handleValidationError(parseResult.error);
    return addCorsHeaders(response, origin);
  }

  // 4. ビジネスロジックを実行
  const result = await handleDirectData(parseResult.data);

  // 5. エラー処理
  if (!result.success) {
    let errorResponse: NextResponse;
    if (result.error.type === "session") {
      errorResponse = handleSessionError(result.error.errorType);
    } else {
      errorResponse = createErrorNextResponse({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: result.error.message,
        details: result.error.details,
      });
    }
    return addCorsHeaders(errorResponse, origin);
  }

  // 6. レスポンス検証
  const responseValidation = directDataResponseSchema.safeParse(result.data);
  if (!responseValidation.success) {
    console.error(
      "[DirectData] レスポンス検証に失敗しました:",
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
