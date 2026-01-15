export const runtime = "nodejs";

import { promises as fs } from "node:fs";

import { fpInstructor } from "@/agents/fpInstructor";
import { jsonEditor } from "@/agents/jsonEditor";
import { createSessionId } from "@/libs/google/createSessionId";
import { getAccessToken } from "@/libs/google/getAccessToken";
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

  // === FP AI によるJson更新指示の生成 ===
  // 指示を作成 TODO プロンプト整備＆別ファイルへの切り出し
  const promptInstructToJsonEditor = `あなたの指示をインプットとして、この後、JSON更新AIがJSONを生成します。
    あなたはユーザーへの質問返しはせず、Json更新AIに対する指示を出してください。
    Json更新AIへの指示はJSON形式ではなく口語的にお願いしたいのと、JSON生成AIに対してJSONを生成するように明示的に指示してください。
    ユーザーのコメントは次のとおりです。`;

  const fpAiInstructionStart = Date.now();
  const instructions = await fpInstructor(
    accessToken,
    userId,
    sessionId,
    promptInstructToJsonEditor,
    userMessage,
  );
  console.log("==============================");
  console.log(
    `FP AI （Json更新指示）の処理結果（process time: ${Date.now() - fpAiInstructionStart}）`,
  );
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

  // === ライフプラン表の作成 ===

  // TODO input: ヒアリングJSON, output: ライフプランJSON
  // TODO input: ライフプランJSON, output: ライフプランTSV

  // === FP AI によるライフプランの生成 ===

  const tsvPath = "dst/lifeplan_normalized_long.tsv";
  const tsv = await fs.readFile(tsvPath, "utf-8");

  //
  const promptRequestFPCommentToLifePlan = [
    "以下にライフプラン表を表すTSVデータがあります。",
    "TSVはタブ区切りで、1行目はヘッダーです。",
    "ライフプラン表とヒアリング内容を鑑みて、FPとしての評価及びユーザーが行うべきネクストアクションを提示してください。",
    "",
    "```tsv",
    tsv.trimEnd(), // 末尾改行の暴発防止
    "```",
  ].join("\n");

  console.log(promptRequestFPCommentToLifePlan);

  const fpAiCommentStart = Date.now();
  const comment = await fpInstructor(
    accessToken,
    userId,
    sessionId,
    promptRequestFPCommentToLifePlan,
    userMessage,
  );
  console.log("==============================");
  console.log(
    `FP AI (コメント)の処理結果（process time: ${Date.now() - fpAiCommentStart}）`,
  );
  console.log("-----");
  console.log(comment);
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
