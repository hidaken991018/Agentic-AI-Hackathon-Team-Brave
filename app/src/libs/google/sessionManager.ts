/**
 * セッション管理サービス
 *
 * Vertex AI Agent Engine Sessions API（REST API パターン）を使用してヒアリングセッションを管理します。
 * 匿名認証を前提としており、ユーザー ID とセッション ID は紐付けません。
 *
 * REST API ドキュメント:
 * https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/sessions/manage-sessions-api
 *
 * @module sessionManager
 */

import { AxiosError } from "axios";
import { GoogleAuth } from "google-auth-library";

import { CONSTS } from "@/consts";
import { axiosClient } from "@/libs/common/axiosClient";
import {
  getSessionsBaseURI,
  getSessionURI_REST,
} from "@/libs/google/generateURI";

/** セッションの有効期間（日数） */
const SESSION_TTL_DAYS = 10;

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
  /** セッション ID（UUID v4） */
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

  return { location, projectId, reasoningEngineId };
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
 * 新規セッションを作成（REST API パターン）
 *
 * REST API エンドポイント: POST /sessions
 * リクエストボディ: { userId: string, ttl: string }
 *
 * @param userId - ユーザー ID（匿名セッションでも必須）
 * @returns 成功時はセッション ID（UUID v4）、失敗時はエラー
 */
export async function createSession(
  userId: string,
): Promise<Result<string, SessionError>> {
  const { location, projectId, reasoningEngineId } = getConfig();

  try {
    const token = await getAuthenticatedClient();

    // REST API パターン: POST /sessions
    const res = await axiosClient.post(
      getSessionsBaseURI(location, projectId, reasoningEngineId),
      {
        userId,
        // REST API の TTL 形式: "{seconds}s"（例: "864000s"）
        ttl: `${SESSION_TTL_DAYS * 24 * 60 * 60}s`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const json = res.data;

    // REST API レスポンス形式:
    // { "name": "projects/.../sessions/SESSION_ID", ... }
    // セッション ID は name フィールドの最後の部分
    let sessionId: string | undefined;

    if (json?.name) {
      // name から sessionId を抽出
      const parts = json.name.split("/");
      sessionId = parts[parts.length - 1];
    }

    if (!sessionId) {
      return {
        ok: false,
        error: {
          code: "SESSION_CREATE_FAILED",
          message: `session_id not found in response: ${JSON.stringify(json)}`,
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
): Promise<Result<void, SessionError>> {
  const { location, projectId, reasoningEngineId } = getConfig();

  try {
    const token = await getAuthenticatedClient();

    // REST API パターン: POST /sessions/{sessionId}:appendEvent
    await axiosClient.post(
      `${getSessionURI_REST(location, projectId, reasoningEngineId, sessionId)}:appendEvent`,
      {
        author: "system",
        timestamp: new Date().toISOString(),
        content: {
          role: "system",
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
