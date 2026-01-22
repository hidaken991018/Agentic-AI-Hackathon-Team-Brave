// app/api/agent/query/route.ts
export const runtime = "nodejs";

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

  // === FP AI によるLife Compassの生成 ===
  const requestToAi = `ユーザーへの質問返しは一切行わず、以下の3つのセクションで構成されるLife Compassを出力してください。

    ■ユーザーへの返信コメント
    ・ユーザーの言葉を否定せず、ライフプランデータに基づいて現状分析や将来へのアドバイスを1〜3文で伝えてください。
    ・具体的な根拠（例：「今の資金状況であれば教育資金の準備は順調ですね」など）を交えたコメントを心がけてください。

    ■ネクストアクション
    ・ライフプランデータを分析し、次に確認・入力すべき項目(例:具体的な月々の支出、住宅ローンの予定など)を1つ提案してください。
    ・「〜を確認してください」「〜の準備を始めましょう」といった形式とし、質問形式（〜ですか？）は禁止します。

    ■ライフプラン表
    ・提供されたライフプランデータ（section, group, year, value）を読み解き、以下の2形式で出力してください。

    1. 【Markdownテーブル形式】
       主要なライフイベントが発生する年や、5年刻みの節目（2025, 2030, 2035...）を抽出し、家族別に以下の構成で表を作成してください。
       | 西暦 | 年齢(太郎) | ライフイベント | 世帯年収 | 純資産(貯蓄残高) |
       | :--- | :--- | :--- | :--- | :--- |
       ※「純資産」の推移がわかるように必ず含めてください。

    2. 【推移グラフ用データ】
       フロントエンドのグラフライブラリで描画するためのJSONデータを、以下のルールで出力してください。

       ・形式：JSONの配列形式（[{"year": 2025, "income": 700, ...}, ...]）
       ・項目：西暦(year)、世帯年収(income)、支出(expense)、純資産(netWorth)
       ・間隔：yearカラムの内容をもとに、5年刻みのデータポイントを作成してください。`;

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
