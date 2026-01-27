/**
 * 認証付き API 呼び出しヘルパー
 *
 * Authorization: Bearer トークンを自動的に付与する
 * API 呼び出しヘルパー関数を提供します。
 *
 * @module hearingApi
 */

import { User } from "firebase/auth";

/**
 * 認証付き API 呼び出しヘルパー
 *
 * Authorization: Bearer トークンを自動的に付与します。
 *
 * @param user - Firebase ユーザーオブジェクト
 * @param url - リクエスト URL
 * @param options - fetch オプション
 * @returns fetch レスポンス
 *
 * @example
 * ```typescript
 * const response = await authenticatedFetch(
 *   user,
 *   "/api/hearing/create-session",
 *   {
 *     method: "POST",
 *     body: JSON.stringify({ sessionId }),
 *   },
 * );
 * ```
 */
export async function authenticatedFetch(
  user: User,
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  // Firebase ID トークンを取得
  const idToken = await user.getIdToken();

  // Authorization ヘッダーを追加
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${idToken}`);

  return fetch(url, {
    ...options,
    headers,
  });
}
