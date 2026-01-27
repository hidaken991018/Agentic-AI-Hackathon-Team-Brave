/**
 * AI Agent セッション作成 API エンドポイント
 *
 * Vertex AI Agent Engine のセッションを作成します。
 * 認証されたユーザーの userId を使用してセッションを初期化し、
 * 会話の継続性を管理します。
 *
 * @module api/ai-agent/session
 */

import { NextRequest, NextResponse } from "next/server";

import { createSessionId } from "@/libs/google/createSessionId";
import { withAuth, addCorsHeaders } from "@/middleware/authMiddleware";

/**
 * OPTIONS /api/ai-agent/session
 *
 * CORSプリフライトリクエストを処理
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return addCorsHeaders(new NextResponse(null, { status: 204 }), origin);
}

/**
 * POST /api/ai-agent/session
 *
 * AI Agent セッション ID を作成
 *
 * Vertex AI Agent Engine のセッションを作成します。
 * Authorization: Bearer トークンから userId を取得し、
 * ユーザー専用のセッションを初期化します。
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  try {
    // 1. 認証チェック（Authorization: Bearer から）
    const authResult = await withAuth(request, { allowAnonymous: true });
    if (!authResult.authenticated) {
      return addCorsHeaders(authResult.response!, origin);
    }

    const userId = authResult.userId!; // 認証トークンから取得

    console.log("[AIAgentSession] Creating session for userId:", userId);

    // 2. AI Agent セッション作成
    const sessionId = await createSessionId(userId);

    console.log("[AIAgentSession] Session created:", sessionId);

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        sessionId,
      }),
      origin,
    );
  } catch (error) {
    console.error("[AIAgentSession] Error:", error);

    return addCorsHeaders(
      NextResponse.json(
        { success: false, error: "Failed to create session" },
        { status: 500 },
      ),
      origin,
    );
  }
}
