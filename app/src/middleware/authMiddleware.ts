/**
 * 認証ミドルウェア
 *
 * Firebase Authentication の匿名認証トークンを検証し、
 * CORS 設定を管理します。
 *
 * @module authMiddleware
 */

import { NextRequest, NextResponse } from "next/server";

import { handleAuthError } from "@/libs/common/errorHandler";

/**
 * CORS 許可オリジン設定
 */
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean) as string[];

/**
 * Firebase Authentication トークンを検証
 *
 * 匿名認証の場合もトークン構造と有効期限を検証します。
 * Firebase Admin SDK を使用しないクライアントサイドデコード方式。
 *
 * @param token - JWT トークン文字列
 * @returns 有効な場合 true、無効な場合 false
 */
async function validateFirebaseToken(token: string): Promise<boolean> {
  try {
    // JWT トークンをデコード（base64url）
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("[Auth] トークン形式が無効: 3パートが必要です");
      return false;
    }

    // ペイロードをデコード
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );

    // 有効期限をチェック
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn("[Auth] トークンの有効期限切れ");
      return false;
    }

    // 発行者（Firebase プロジェクト）をチェック
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const expectedIssuer = `https://securetoken.google.com/${projectId}`;
    if (payload.iss !== expectedIssuer) {
      console.warn("[Auth] 発行者が無効:", payload.iss);
      return false;
    }

    // オーディエンスをチェック
    if (payload.aud !== projectId) {
      console.warn("[Auth] オーディエンスが無効:", payload.aud);
      return false;
    }

    // 匿名認証の場合、provider_id は "anonymous"
    // 匿名認証と他のプロバイダの両方を許可
    console.log(
      "[Auth] トークン検証成功。プロバイダ:",
      payload.firebase?.sign_in_provider || "unknown",
    );

    return true;
  } catch (error) {
    console.error("[Auth] トークン検証エラー:", error);
    return false;
  }
}

/**
 * Authorization ヘッダーから Bearer トークンを抽出
 *
 * @param authHeader - Authorization ヘッダーの値
 * @returns トークン文字列、または null
 */
function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
}

/**
 * リクエストのオリジンが許可されているかチェック
 *
 * @param origin - リクエストの Origin ヘッダー
 * @returns 許可されている場合 true
 */
function isOriginAllowed(origin: string | null): boolean {
  // 同一オリジンリクエストは Origin ヘッダーがない
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * 認証結果型
 *
 * - authenticated: true → 認証成功
 * - authenticated: false → 認証失敗、エラーレスポンス付き
 */
export type AuthResult =
  | { authenticated: true }
  | { authenticated: false; response: NextResponse };

/**
 * Firebase Authentication トークンを検証するミドルウェア
 *
 * 匿名認証をサポートします。
 *
 * @param request - Next.js リクエストオブジェクト
 * @returns 認証結果
 */
export async function withAuth(request: NextRequest): Promise<AuthResult> {
  // CORS チェック
  const origin = request.headers.get("origin");
  if (!isOriginAllowed(origin)) {
    console.warn("[Auth] 許可されていないオリジン:", origin);
    return {
      authenticated: false,
      response: handleAuthError(),
    };
  }

  // トークンを抽出
  const authHeader = request.headers.get("authorization");
  const token = extractBearerToken(authHeader);

  if (!token) {
    console.warn("[Auth] トークンが提供されていません");
    return {
      authenticated: false,
      response: handleAuthError(),
    };
  }

  // トークンを検証
  const isValid = await validateFirebaseToken(token);
  if (!isValid) {
    return {
      authenticated: false,
      response: handleAuthError(),
    };
  }

  return { authenticated: true };
}

/**
 * レスポンスに CORS ヘッダーを追加
 *
 * @param response - Next.js レスポンスオブジェクト
 * @param origin - リクエストの Origin ヘッダー
 * @returns CORS ヘッダー付きレスポンス
 */
export function addCorsHeaders(
  response: NextResponse,
  origin: string | null,
): NextResponse {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}

/**
 * OPTIONS プリフライトリクエストを処理
 *
 * @param request - Next.js リクエストオブジェクト
 * @returns CORS ヘッダー付き 204 レスポンス
 */
export function handlePreflight(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response, origin);
}
