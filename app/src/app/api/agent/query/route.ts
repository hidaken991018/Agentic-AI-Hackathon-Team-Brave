// app/api/agent/query/route.ts
export const runtime = "nodejs";

import { fpInstructor } from "@/app/agents/fpInstructor";
import { jsonEditor } from "@/app/agents/jsonEditor";
import { createSessionId } from "@/app/libs/google/createSessionId";
import { getAccessToken } from "@/app/libs/google/getAccessToken";
import { hearingJsonSchemaForLlm } from "@/app/schema/hearingJsonSchema";

type Body = {
  userId: string;
  usedSessionId: string | undefined;
  userMessage: string;
};

export async function POST(req: Request) {
  const { userId, usedSessionId, userMessage } = (await req.json()) as Body;

  console.log("Received request", userMessage);

  // === アクセストークン取得 ===
  const accessToken = await getAccessToken();

  // === セッションの取得 ===
  const sessionId = usedSessionId
    ? usedSessionId
    : await createSessionId(userId);

  // === FP AI によるJson更新指示の生成 ===
  // 指示を作成 TODO プロンプト整備＆別ファイルへの切り出し
  const requestToAi = `あなたの指示をインプットとして、この後、JSON更新AIがJSONを生成します。
    あなたはユーザーへの質問返しはせず、Json更新AIに対する指示を出してください。
    Json更新AIへの指示はJSON形式ではなく口語的にお願いしたいのと、JSON生成AIに対してJSONを生成するように明示的に指示してください。
    ユーザーのコメントは次のとおりです。`;

  const fpAiStart = Date.now();
  const instructions = await fpInstructor(
    accessToken,
    userId,
    sessionId,
    requestToAi,
    userMessage,
  );
  console.log("==============================");
  console.log(`FP AI の処理結果（process time: ${Date.now() - fpAiStart}）`);
  console.log("-----");
  console.log(instructions);
  console.log("==============================");

  // === Json 更新 AI によるJson更新指示の生成 ===
  const jsonEditorStart = Date.now();
  const response = await jsonEditor(hearingJsonSchemaForLlm, instructions);
  console.log("==============================");
  console.log(
    `json Editor AI の処理結果（process time: ${Date.now() - jsonEditorStart}）`,
  );
  console.log("-----");
  console.log(response);
  console.log("==============================");

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
