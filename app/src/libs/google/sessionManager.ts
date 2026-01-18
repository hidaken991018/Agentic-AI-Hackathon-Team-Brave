/**
 * セッション管理サービス
 *
 * Vertex AI Agent Engine Sessions を使用してヒアリングセッションを管理します。
 * 匿名認証を前提としており、ユーザー ID とセッション ID は紐付けません。
 *
 * @module sessionManager
 */

import { AxiosError } from "axios";
import { GoogleAuth } from "google-auth-library";

import { CONSTS } from "@/consts";
import { axiosClient } from "@/libs/common/axiosClient";
import { getSessionURI } from "@/libs/google/generateURI";

/** UUID v4 形式の検証用正規表現 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** セッションの有効期間（日数） */
const SESSION_TTL_DAYS = 10;

/** セッションの有効期間（ミリ秒） */
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

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
 */
export interface SessionManagerService {
  /** 新規セッションを作成 */
  createSession(): Promise<Result<string, SessionError>>;
  /** セッションの存在確認と有効期限チェック */
  validateSession(
    sessionId: string,
  ): Promise<Result<SessionState, SessionError>>;
  /** セッションデータを更新（直接データ・解釈データの保存） */
  updateSessionData(
    sessionId: string,
    data: unknown,
  ): Promise<Result<void, SessionError>>;
}

/**
 * 文字列が UUID v4 形式かどうかを検証
 * @param id - 検証対象の文字列
 * @returns UUID v4 形式の場合 true
 */
export function isValidUUIDv4(id: string): boolean {
  return UUID_V4_REGEX.test(id);
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
 * 新規セッションを作成（TTL は Agent Engine 側で管理）
 *
 * 匿名認証のため、セッションはユーザー ID に紐付けません。
 *
 * @returns 成功時はセッション ID（UUID v4）、失敗時はエラー
 */
export async function createSession(): Promise<Result<string, SessionError>> {
  const LOCATION = process.env.VERTEX_AGT_LOCATION!;
  const RESOURCE_NAME = process.env.VERTEX_AGT_RESOURCE_NAME!;

  try {
    const token = await getAuthenticatedClient();

    const res = await axiosClient.post(
      getSessionURI(LOCATION, RESOURCE_NAME),
      {
        classMethod: "async_create_session",
        input: {
          // 匿名セッション - user_id は空文字
          user_id: "",
          // Agent Engine の TTL（秒単位）
          ttl_seconds: SESSION_TTL_DAYS * 24 * 60 * 60,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const json = res.data;
    const sessionId =
      json?.output?.id ?? json?.output?.session_id ?? json?.session_id;

    if (!sessionId) {
      return {
        ok: false,
        error: {
          code: "SESSION_CREATE_FAILED",
          message: `session_id not found in response: ${JSON.stringify(json)}`,
        },
      };
    }

    // 返却されたセッション ID が UUID v4 形式か検証
    if (!isValidUUIDv4(sessionId)) {
      return {
        ok: false,
        error: {
          code: "SESSION_CREATE_FAILED",
          message: `Invalid session ID format: ${sessionId}`,
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
 * セッション ID の検証（存在確認と有効期限チェック）
 *
 * @param sessionId - 検証対象のセッション ID
 * @returns 成功時はセッション状態、失敗時はエラー
 */
export async function validateSession(
  sessionId: string,
): Promise<Result<SessionState, SessionError>> {
  // まず UUID v4 形式を検証
  if (!isValidUUIDv4(sessionId)) {
    return {
      ok: false,
      error: {
        code: "SESSION_NOT_FOUND",
        message: `Invalid session ID format: ${sessionId}`,
      },
    };
  }

  const LOCATION = process.env.VERTEX_AGT_LOCATION!;
  const RESOURCE_NAME = process.env.VERTEX_AGT_RESOURCE_NAME!;

  try {
    const token = await getAuthenticatedClient();

    const res = await axiosClient.post(
      getSessionURI(LOCATION, RESOURCE_NAME),
      {
        classMethod: "async_get_session",
        input: {
          session_id: sessionId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const json = res.data;
    const sessionData = json?.output ?? json;

    // セッションメタデータを抽出
    const createdAt = sessionData?.created_at ?? sessionData?.createdAt;
    const expiresAt = sessionData?.expires_at ?? sessionData?.expiresAt;

    // 有効期限情報がある場合、期限切れかチェック
    if (expiresAt) {
      const expirationTime = new Date(expiresAt).getTime();
      if (Date.now() > expirationTime) {
        return {
          ok: false,
          error: {
            code: "SESSION_EXPIRED",
            message: `Session expired at ${expiresAt}`,
          },
        };
      }
    }

    // 有効期限が未提供の場合は TTL から計算
    const calculatedCreatedAt = createdAt ?? new Date().toISOString();
    const calculatedExpiresAt =
      expiresAt ??
      new Date(
        new Date(calculatedCreatedAt).getTime() + SESSION_TTL_MS,
      ).toISOString();

    return {
      ok: true,
      value: {
        id: sessionId,
        createdAt: calculatedCreatedAt,
        expiresAt: calculatedExpiresAt,
      },
    };
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
          message: `Failed to validate session: ${errorData}`,
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
 * セッションデータを更新（直接データ・解釈データの保存）
 *
 * @param sessionId - 更新対象のセッション ID
 * @param data - 保存するデータ
 * @returns 成功時は void、失敗時はエラー
 */
export async function updateSessionData(
  sessionId: string,
  data: unknown,
): Promise<Result<void, SessionError>> {
  // まずセッションの存在と有効期限を検証
  const validationResult = await validateSession(sessionId);
  if (!validationResult.ok) {
    return validationResult;
  }

  const LOCATION = process.env.VERTEX_AGT_LOCATION!;
  const RESOURCE_NAME = process.env.VERTEX_AGT_RESOURCE_NAME!;

  try {
    const token = await getAuthenticatedClient();

    await axiosClient.post(
      getSessionURI(LOCATION, RESOURCE_NAME),
      {
        classMethod: "async_update_session",
        input: {
          session_id: sessionId,
          data: data,
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
          message: `Failed to update session data: ${errorData}`,
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
  validateSession,
  updateSessionData,
};

export default sessionManager;
