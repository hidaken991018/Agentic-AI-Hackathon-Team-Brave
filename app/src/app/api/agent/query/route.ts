// app/api/agent/query/route.ts
export const runtime = "nodejs";

import { fpInstructor } from "@/app/agents/fpInstructor";
import { jsonEditor } from "@/app/agents/jsonEditor";
import { createSessionId } from "@/app/libs/google/createSessionId";
import { getAccessToken } from "@/app/libs/google/getAccessToken";
import { hearingJsonSchemaForLlm } from "@/app/schema/hearingJsonSchema";

type Body = {
  userId: string;
  userMessage: string;
};

export async function POST(req: Request) {
  const { userId, userMessage } = (await req.json()) as Body;

  // === アクセストークン取得 ===
  const accessToken = await getAccessToken();

  // === セッションの取得 ===
  // TODO セッションIDの有効性チェック => 有効な場合はセッション生成スキップ
  const sessionId = await createSessionId(userId);

  // === FP AI によるJson更新指示の生成 ===
  // 指示を作成 TODO プロンプト整備＆別ファイルへの切り出し
  const requestToAi = `ユーザーのコメントを受けて、json更新AIに対する指示を出してください
    （あなたのアドバイスの要点と提案と次のアクションに分けて指示を出してください。）。
    質問返しはせず、json更新AIに対する指示を出してください。指示はJSON形式ではなく口語的にお願いします。
    ユーザーのコメントは右記。`;

  const instructions = await fpInstructor(
    accessToken,
    userId,
    sessionId,
    requestToAi,
    userMessage,
  );
  console.log("FP AIの成果物: ", instructions);

  // === Json 更新 AI によるJson更新指示の生成 ===
  const response = await jsonEditor(hearingJsonSchemaForLlm, instructions);
  console.log("JSON 作成AIの成果物: ", response);

  // === レスポンス ===
  let parsed: unknown;
  try {
    parsed = JSON.parse(response);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON from model", raw: response }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ userId, sessionId, parsed }), {
    headers: { "Content-Type": "application/json" },
  });
}
