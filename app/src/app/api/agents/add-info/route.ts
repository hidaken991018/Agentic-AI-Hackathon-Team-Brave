// app/api/agents/add-info/route.ts
export const runtime = "nodejs";

import { fpInstructor } from "@/agents/fpInstructor";
import { createSessionId } from "@/libs/google/createSessionId";
import { getAccessToken } from "@/libs/google/getAccessToken";

type Body = {
  userId: string;
  usedSessionId: string | undefined;
  userMessage: string;
};

export async function POST(req: Request) {
  const { userId, usedSessionId, userMessage } = (await req.json()) as Body;

  console.log("Received request to add session info", userMessage);

  // === アクセストークン取得 ===
  const accessToken = await getAccessToken();

  // === セッションの取得 ===
  const sessionId = usedSessionId
    ? usedSessionId
    : await createSessionId(userId);

  // === FP AI によるセッション情報の追加 ===
  const requestToAi = `ユーザーから以下の情報を受け取りました。セッションにこの情報を記録してください。
    ユーザーのコメントは次のとおりです。`;

  const fpAiStart = Date.now();
  await fpInstructor(
    accessToken,
    userId,
    sessionId,
    requestToAi,
    userMessage,
  );
  console.log("==============================");
  console.log(`FP AI の処理完了（process time: ${Date.now() - fpAiStart}）`);
  console.log("セッションに情報を追加しました");
  console.log("==============================");

  // === シンプルなレスポンス（アウトプットは求めない） ===
  return new Response(
    JSON.stringify({
      success: true,
      userId,
      sessionId,
      message: "セッションに情報を追加しました"
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}
