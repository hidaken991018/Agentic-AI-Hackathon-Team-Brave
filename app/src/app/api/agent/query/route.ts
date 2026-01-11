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
  const requestToAi = `ユーザーへの質問返しは一切行わず、以下の3つのセクションに従って回答を出力してください。
    あなたの回答は、後続の「JSON更新AI」へのインプットとしても利用されます。

    ■ユーザーへの返信コメント
    ・ユーザーの言葉を否定せず、ヒアリングデータに基づいた現状分析や将来へのアドバイスを1〜3文で伝えてください。
    ・具体的な根拠（例：「今の資金状況であれば教育資金の準備は順調ですね」など）を交えたコメントを心がけてください。

    ■ネクストアクション
    ・現在のヒアリング状況を分析し、次に確認・入力すべき項目(例:具体的な月々の支出、住宅ローンの予定など)を1つ提案してください。
    ・「〜を確認してください」「〜の準備を始めましょう」といった形式とし、質問形式（〜ですか？）は禁止します。

    ■JSON更新AIへの指示
    ・後続の「JSON更新AI」に対する、データ更新のための具体的な指示を作成してください。
    ・この指示はJSON形式ではなく、口語的な説明で記述してください。`;

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
