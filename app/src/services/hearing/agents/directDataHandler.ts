/**
 * 直接データハンドラー
 *
 * ユーザーから直接入力されたデータを受け取り、セッションに保存するためのハンドラーモジュール。
 * 新規セッションの作成または既存セッションへのデータ追加を行い、データをAgent Engine Sessionsに格納する。
 *
 * @module directDataHandler
 */

import {
  appendSessionData,
  createSession,
} from "@/libs/google/sessionManager";
import {
  type DirectDataRequest,
  type DirectDataResponse,
} from "@/services/hearing/schema/directDataSchema";

/**
 * ハンドラーエラーの型定義
 *
 * セッション関連エラーとサービスエラーを区別する
 */
export type HandlerError =
  | { type: "session"; errorType: "expired" | "not_found" }
  | { type: "service"; message: string; details?: string };

/**
 * ハンドラー操作の結果型
 *
 * 成功時はDirectDataResponseを返し、失敗時はエラー情報を返す
 */
export type DirectDataHandlerResult =
  | { success: true; data: DirectDataResponse }
  | { success: false; error: HandlerError };

/**
 * 直接データ受信のビジネスロジックを処理する
 *
 * 処理フロー:
 * 1. sessionIdが指定されていない場合は新規セッションを作成
 * 2. リトライ機能付きでAgent Engine Sessionsに直接データを保存
 * 3. sessionIdとタイムスタンプを含むデータを返却
 *
 * 注意: REST API では期限切れセッションが自動削除されるため、
 *       セッションの事前検証は行わず、appendSessionData の失敗で判定します。
 *
 * @param request - 検証済みのリクエストボディ
 * @returns ハンドラー処理結果（成功時はデータ、失敗時はエラー情報）
 */
export async function handleDirectData(
  request: DirectDataRequest,
): Promise<DirectDataHandlerResult> {
  // 1. セッション処理: 新規作成または既存セッション ID を使用
  let sessionId: string;

  if (request.sessionId) {
    sessionId = request.sessionId;
  } else {
    // 新規セッションの作成
    const createResult = await createSession(request.userId);
    if (!createResult.ok) {
      return {
        success: false,
        error: {
          type: "service",
          message: "セッションの作成に失敗しました",
          details: createResult.error.message,
        },
      };
    }
    sessionId = createResult.value;
  }

  // 2. セッションに直接データを保存（リトライは axiosClient で一元管理）
  // REST API では期限切れセッションが自動削除されるため、
  // 失敗した場合は一律 not_found として扱う
  const storeResult = await appendSessionData(sessionId, request.data);
  if (!storeResult.ok) {
    return {
      success: false,
      error: { type: "session", errorType: "not_found" },
    };
  }

  // 3. 成功データの構築
  const storedAt = new Date().toISOString();
  const responseData: DirectDataResponse = {
    success: true,
    sessionId,
    storedAt,
  };

  return {
    success: true,
    data: responseData,
  };
}
