/**
 * セッション管理サービス
 *
 * Vertex AI Agent Engine を使用してヒアリングセッションを管理します。
 * 匿名認証を前提としており、ユーザー ID とセッション ID は紐付けません。
 *
 * - createSession: ADK パターン（:query エンドポイント）を使用
 * - appendSessionData: REST API パターン（Sessions API）を使用
 *
 * @module sessionManager
 */

import { AxiosError } from "axios";
import { GoogleAuth } from "google-auth-library";

import { CONSTS } from "@/consts";
import { axiosClient } from "@/libs/common/axiosClient";
import { getSessionURI, getSessionURI_REST } from "@/libs/google/generateURI";

/**
 * 型安全なエラーハンドリングのための Result 型
 * - ok: true → 成功、value にデータ
 * - ok: false → 失敗、error にエラー情報
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/**
 * セッション状態を表すインターフェース
 */
export interface SessionState {
  /** セッション ID */
  id: string;
  /** 作成日時（ISO 8601） */
  createdAt: string;
  /** 有効期限（ISO 8601） */
  expiresAt: string;
}

/**
 * セッション関連のエラー型
 */
export type SessionError =
  | { code: "SESSION_NOT_FOUND"; message: string }
  | { code: "SESSION_EXPIRED"; message: string }
  | { code: "SESSION_CREATE_FAILED"; message: string };

/**
 * セッション管理サービスのインターフェース
 *
 * REST API パターンに移行:
 * - validateSession は削除（REST API では期限切れセッションが自動削除されるため）
 * - updateSessionData は appendSessionData に改名（appendEvent API を使用）
 */
export interface SessionManagerService {
  /** 新規セッションを作成 */
  createSession(userId: string): Promise<Result<string, SessionError>>;
  /** セッションにデータを追加（appendEvent API を使用） */
  appendSessionData(
    sessionId: string,
    data: unknown,
    invocationId?: string,
  ): Promise<Result<void, SessionError>>;
}

/**
 * 環境変数から設定を取得するヘルパー
 *
 * VERTEX_AGT_RESOURCE_NAME から PROJECT_ID と REASONING_ENGINE_ID を抽出するか、
 * 専用の環境変数を使用
 */
function getConfig() {
  const location = process.env.VERTEX_AGT_LOCATION!;
  const resourceName = process.env.VERTEX_AGT_RESOURCE_NAME!;

  // VERTEX_PROJECT_ID と VERTEX_REASONING_ENGINE_ID が設定されている場合はそれを使用
  let projectId = process.env.VERTEX_PROJECT_ID;
  let reasoningEngineId = process.env.VERTEX_REASONING_ENGINE_ID;

  // 未設定の場合は RESOURCE_NAME からパース
  // 形式: projects/{project}/locations/{location}/reasoningEngines/{reasoningEngineId}
  if (!projectId || !reasoningEngineId) {
    const match = resourceName.match(
      /^projects\/([^/]+)\/locations\/[^/]+\/reasoningEngines\/([^/]+)$/,
    );
    if (match) {
      projectId = projectId || match[1];
      reasoningEngineId = reasoningEngineId || match[2];
    } else {
      throw new Error(
        `Invalid VERTEX_AGT_RESOURCE_NAME format: ${resourceName}. ` +
          `Expected: projects/{project}/locations/{location}/reasoningEngines/{reasoningEngineId}`,
      );
    }
  }

  return { location, resourceName, projectId, reasoningEngineId };
}

/**
 * Google Cloud API 呼び出し用の認証済みクライアントを取得
 * @returns アクセストークン
 * @throws アクセストークン取得に失敗した場合
 */
async function getAuthenticatedClient() {
  const auth = new GoogleAuth({
    scopes: [CONSTS.ENDPOINT.GOOGLE.CREATE_SESSION_ID],
  });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();

  if (!token) {
    throw new Error("Failed to get access token");
  }

  return token;
}

/**
 * 新規セッションを作成（ADK パターン）
 *
 * ADK エンドポイント: POST /:query with classMethod: "async_create_session"
 * リクエストボディ: { classMethod: string, input: { user_id: string } }
 *
 * @param userId - ユーザー ID（匿名セッションでも必須）
 * @returns 成功時はセッション ID、失敗時はエラー
 */
export async function createSession(
  userId: string,
): Promise<Result<string, SessionError>> {
  const { location, resourceName } = getConfig();

  try {
    const token = await getAuthenticatedClient();

    // ADK パターン: POST /:query with classMethod
    const res = await axiosClient.post(
      getSessionURI(location, resourceName),
      {
        classMethod: "async_create_session",
        input: { user_id: userId },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    // ADK レスポンス形式: { output: { id: "...", session_id: "..." } }
    const sessionId =
      res.data?.output?.id ??
      res.data?.output?.session_id ??
      res.data?.session_id;

    if (!sessionId) {
      return {
        ok: false,
        error: {
          code: "SESSION_CREATE_FAILED",
          message: `session_id not found in response: ${JSON.stringify(res.data)}`,
        },
      };
    }

    return { ok: true, value: sessionId };
  } catch (error) {
    // axios エラーの場合はレスポンスデータを含める
    if (error instanceof AxiosError && error.response) {
      return {
        ok: false,
        error: {
          code: "SESSION_CREATE_FAILED",
          message: `Failed to create session: ${JSON.stringify(error.response.data)}`,
        },
      };
    }
    return {
      ok: false,
      error: {
        code: "SESSION_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * セッションにデータを追加（appendEvent API を使用）
 *
 * REST API エンドポイント: POST /sessions/{sessionId}:appendEvent
 *
 * 注意: REST API では期限切れセッションが自動削除されるため、
 *       SESSION_EXPIRED と SESSION_NOT_FOUND の区別はできません。
 *       セッションが見つからない場合は一律 SESSION_NOT_FOUND を返します。
 *
 * @param sessionId - データを追加するセッション ID
 * @param data - 保存するデータ
 * @returns 成功時は void、失敗時はエラー
 */
export async function appendSessionData(
  sessionId: string,
  data: unknown,
  invocationId: string,
): Promise<Result<void, SessionError>> {
  const { location, projectId, reasoningEngineId } = getConfig();

  try {
    const token = await getAuthenticatedClient();

    // REST API パターン: POST /sessions/{sessionId}:appendEvent
    await axiosClient.post(
      `${getSessionURI_REST(location, projectId, reasoningEngineId, sessionId)}:appendEvent`,
      {
        name: `projects/${projectId}/locations/${location}/reasoningEngines/${reasoningEngineId}/sessions/${sessionId}/events/${invocationId}`,
        author: "user",
        invocationId: invocationId,
        timestamp: new Date().toISOString(),
        content: {
          role: "user",
          parts: [{ text: JSON.stringify(data) }],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return { ok: true, value: undefined };
  } catch (error) {
    // axios エラーの場合はステータスコードを確認
    if (error instanceof AxiosError && error.response) {
      const errorData = JSON.stringify(error.response.data);
      if (
        error.response.status === 404 ||
        errorData.toLowerCase().includes("not found")
      ) {
        return {
          ok: false,
          error: {
            code: "SESSION_NOT_FOUND",
            message: `Session not found: ${sessionId}`,
          },
        };
      }
      return {
        ok: false,
        error: {
          code: "SESSION_NOT_FOUND",
          message: `Failed to append session data: ${errorData}`,
        },
      };
    }
    return {
      ok: false,
      error: {
        code: "SESSION_NOT_FOUND",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * セッション管理サービスオブジェクト（インターフェース実装）
 */
export const sessionManager: SessionManagerService = {
  createSession,
  appendSessionData,
};

export default sessionManager;
