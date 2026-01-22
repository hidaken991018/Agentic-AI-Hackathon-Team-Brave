// app/api/agent/query/route.ts
export const runtime = "nodejs";

import { fpInstructor } from "@/agents/fpInstructor";
import { jsonEditor } from "@/agents/jsonEditor";
import { createSessionId } from "@/libs/google/createSessionId";
import { getAccessToken } from "@/libs/google/getAccessToken";
import { aiCommentJsonSchemaForLlm } from "@/schema/aiCommentJsonSchema";
import { hearingJsonSchemaForLlm } from "@/schema/hearingJsonSchema";

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

  // === FP AI によるLife Compassの生成 ===
 const requestToAi = `ライフプランデータを分析し、指定されたJSON形式でLife Compassを出力してください。
  返信は必ず以下のTypeScriptインターフェース（Zodスキーマ）に準拠した純粋なJSONのみとし、説明文やMarkdownの装飾（\`\`\`json など）は含めないでください。
  出力は必ず { で始まり、 } で終わるようにしてください

  ### 出力スキーマ
  ${aiCommentJsonSchemaForLlm}

  ### 各項目の作成ルール
  1. commentList:
    - ユーザーを否定せず、データに基づく現状分析を伝えてください。
    - 具体的な根拠（例：「2043年に純資産が黒字化する見込みです」など）を必ず含めてください。

  2. nextActionList:
    - 分析に基づき、次に確認・入力すべき項目を1つ提案してください。
    - 「〜を確認してください」「〜の準備を始めましょう」という形式に限定し、質問形式は禁止します。

  3. quizDirectionList:
    - 説教臭くない「面白い雑学」としてクイズを1問作成してください。
    - ライフプランデータ上の「変化点（支出増、資産の転換期など）」や「リスク」を特定し、それを補完するための学習方針を記述してください。
    - ジャンル例：公的制度、資産運用、行動経済学
    - 記述形式：「ユーザーは〇〇年頃に△△という状況になるため、☆☆に関する知識を問うクイズを出題し、□□の意識を高める方針とする」といった戦略的な内容にしてください。
    - 改行は \n にエスケープし、1つの連続した文字列として格納してください`;

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
