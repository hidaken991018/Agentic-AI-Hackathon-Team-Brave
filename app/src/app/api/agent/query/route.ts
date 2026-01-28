export const runtime = "nodejs";

import { promises as fs } from "node:fs";

import { fpInstructor } from "@/agents/fpInstructor";
import { jsonEditor } from "@/agents/jsonEditor";
import { createSessionId } from "@/libs/google/createSessionId";
import { getAccessToken } from "@/libs/google/getAccessToken";
import { aiCommentJsonSchemaForLlm } from "@/schema/aiCommentJson/aiCommentJsonSchema";
import { hearingJsonSchemaForLlm } from "@/schema/hearingJson/hearingJsonSchema";

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
   const promptInstructToJsonEditor = `ライフプランデータを分析し、以下のルールに従って各項目を作成してください。

  ### 各項目の作成ルール
  1. commentList:
    - ユーザーを否定せず、肯定的に捉えたうえで、データに基づく現状分析を伝えてください。
    - 具体的な根拠（例：「2043年に純資産が黒字化する見込みです」など）を必ず含めてください。

  2. nextActionList:
    - 分析に基づき、次に確認・入力すべき項目を1つ提案してください。
    - アクションを行うことで得られるメリットも併せて記述してください。
    - 「〜を確認してください」「〜の準備を始めましょう」という形式に限定し、質問形式は禁止します。

  3. quizDirectionList:
    - ライフプランデータから特定した「将来の変化点や潜在的リスク」に対し、ユーザーが備えるべき知識や心構えを補完するためのクイズ生成方針を記述してください。
    - 記述形式：「ユーザーは〇〇年頃に△△という状況になるため、☆☆に関する知識を問うクイズを出題し、□□の意識を高める方針とする」といった戦略的な内容にしてください。
    - 改行は \n にエスケープし、1つの連続した文字列として格納してください。`;

  const aijsonResponse = await jsonEditor(aiCommentJsonSchemaForLlm, promptInstructToJsonEditor);

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
