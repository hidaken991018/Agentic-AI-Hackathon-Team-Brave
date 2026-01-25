export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { createSessionId } from "@/libs/google/createSessionId";
import { withAuth, addCorsHeaders } from "@/middleware/authMiddleware";

type CreateSessionBody = {
  userId: string;
};

/**
 * プリフライトリクエストを処理
 */
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return addCorsHeaders(new NextResponse(null, { status: 204 }), origin);
}

/**
 * AIエージェントセッションを作成するエンドポイント
 *
 * @param req - POSTリクエスト
 * @returns セッションIDを含むレスポンス
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    // 認証チェック（匿名OK）
    const authResult = await withAuth(req, { allowAnonymous: true });
    if (!authResult.authenticated) {
      return addCorsHeaders(authResult.response!, origin);
    }

    // トークンからuserIdを取得
    const authenticatedUserId = authResult.userId!;

    // リクエストボディからもuserIdを取得（バリデーション用）
    const { userId } = (await req.json()) as CreateSessionBody;

    if (!userId) {
      return addCorsHeaders(
        NextResponse.json(
          {
            success: false,
            error: "userId is required",
          },
          { status: 400 },
        ),
        origin,
      );
    }

    // 認証トークンのuserIdと一致するか検証
    if (userId !== authenticatedUserId) {
      console.warn(
        `[Auth] User ID mismatch: token=${authenticatedUserId}, body=${userId}`,
      );
      return addCorsHeaders(
        NextResponse.json(
          {
            success: false,
            error: "User ID mismatch",
            code: "USER_ID_MISMATCH",
          },
          { status: 403 },
        ),
        origin,
      );
    }

    console.log("Creating AI agent session for user:", authenticatedUserId);

    // セッションIDを作成
    const aiAgentSessionId = await createSessionId(authenticatedUserId);

    console.log("AI agent session created:", aiAgentSessionId);

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        userId: authenticatedUserId,
        aiAgentSessionId,
      }),
      origin,
    );
  } catch (error) {
    console.error("Failed to create AI agent session:", error);

    return addCorsHeaders(
      NextResponse.json(
        {
          success: false,
          error: "Failed to create AI agent session",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      ),
      origin,
    );
  }
}
