import { getEnv } from "@/config";
import { CONSTS } from "@/consts";
import { queryAIAgent, queryGemini } from "@/libs/google";
import { aiCommentJsonSchemaForLlm } from "@/schema/aiCommentJson/aiCommentJsonSchema";

/**
 * FP AIへのプロンプト（ライフプラン分析用）
 */
function buildFpAnalysisPrompt(lifePlanTsv: string): string {
  return `以下にライフプラン表を表すTSVデータがあります。
TSVはタブ区切りで、1行目はヘッダーです。
ファイナンシャルプランナーとして、このライフプラン表を詳細に分析してください。

分析する際は以下の観点を含めてください：
- 収支のバランスと将来の見通し
- 資産形成の進捗と課題
- ライフイベント（教育費、住宅ローン完済など）の影響
- 潜在的なリスクや注意点
- ユーザーが次に取るべき具体的なアクション

ユーザーを否定せず、肯定的に捉えたうえで、データに基づく現状分析を伝えてください。
具体的な数値や年度（例：「2043年に純資産が黒字化する見込みです」など）を必ず含めてください。

\`\`\`tsv
${lifePlanTsv.trimEnd()}
\`\`\``;
}

/**
 * JSON Editor AIへのプロンプト（構造化用）
 */
function buildJsonEditorPrompt(fpAnalysis: string): string {
  return `${CONSTS.PROMPT.ROLE_DEFINITION.JSON_EDITOR}

以下はファイナンシャルプランナーによるライフプラン分析結果です。
この分析結果を元に、指定されたJSONスキーマに従って構造化してください。

### 各項目の作成ルール
1. commentList:
  - FPの分析から、ユーザーへの現状分析コメントを3つ抽出してください。
  - ユーザーを否定せず、肯定的に捉えた内容にしてください。
  - 具体的な根拠（年度や数値）を必ず含めてください。

2. nextActionList:
  - FPの分析から、次に取るべきアクションを3つ抽出してください。
  - 「〜を確認してください」「〜の準備を始めましょう」という形式に限定し、質問形式は禁止します。
  - アクションを行うことで得られるメリットも併せて記述してください。

3. quizDirectionList:
  - FPの分析から特定された「将来の変化点や潜在的リスク」に対し、ユーザーが備えるべき知識を問うクイズの方針を記述してください。
  - 記述形式：「ユーザーは〇〇年頃に△△という状況になるため、☆☆に関する知識を問うクイズを出題し、□□の意識を高める方針とする」

### FPによる分析結果
${fpAnalysis}`;
}

type AnalyzeWithAgentParams = {
  lifePlanTsv: string;
  accessToken: string;
  userId: string;
  sessionId: string;
};

/**
 * ライフプランTSVを分析し、AIコメントを生成するエージェント（セッション対応版）
 *
 * 2段階構成：
 * 1. FP AI（queryAIAgent）がライフプランを分析（セッション管理あり）
 * 2. JSON Editor AI（queryGemini）が構造化データにまとめる
 *
 * @param params - 分析パラメータ
 * @returns AIコメントJSON文字列
 */
export async function analyzeLifePlanWithAgent(
  params: AnalyzeWithAgentParams,
): Promise<string> {
  const { lifePlanTsv, accessToken, userId, sessionId } = params;

  // Stage 1: FP AI による分析（セッション管理あり）
  const location = (await getEnv("VERTEX_AGT_LOCATION")) || "";
  const resourceName = (await getEnv("VERTEX_AGT_RESOURCE_NAME")) || "";

  const fpPrompt = buildFpAnalysisPrompt(lifePlanTsv);
  const fpQuery = `${CONSTS.PROMPT.ROLE_DEFINITION.FP}${fpPrompt}`;

  console.log("==============================");
  console.log("Stage 1: FP AI によるライフプラン分析開始");
  const fpStart = Date.now();

  const fpAnalysis = await queryAIAgent(
    location,
    resourceName,
    accessToken,
    userId,
    sessionId,
    fpQuery,
  );

  console.log(`FP AI 分析完了（process time: ${Date.now() - fpStart}ms）`);
  console.log("-----");
  console.log(fpAnalysis.substring(0, 500) + "...");
  console.log("==============================");

  // Stage 2: JSON Editor AI による構造化
  console.log("==============================");
  console.log("Stage 2: JSON Editor AI による構造化開始");
  const jsonStart = Date.now();

  const jsonEditorPrompt = buildJsonEditorPrompt(fpAnalysis);
  const structuredResult = await queryGemini(
    aiCommentJsonSchemaForLlm,
    jsonEditorPrompt,
  );

  console.log(`JSON Editor 完了（process time: ${Date.now() - jsonStart}ms）`);
  console.log("-----");
  console.log(structuredResult);
  console.log("==============================");

  return structuredResult;
}

/**
 * ライフプランTSVを分析し、AIコメントを生成するエージェント（簡易版）
 * セッション管理不要の場合に使用
 *
 * @param lifePlanTsv - ライフプランのTSV形式データ
 * @returns AIコメントJSON文字列
 */
export async function analyzeLifePlan(lifePlanTsv: string): Promise<string> {
  const prompt = `${CONSTS.PROMPT.ROLE_DEFINITION.FP}

以下にライフプラン表を表すTSVデータがあります。
TSVはタブ区切りで、1行目はヘッダーです。
ライフプラン表を分析し、以下のルールに従って各項目を作成してください。

### 各項目の作成ルール
1. commentList:
  - ユーザーを否定せず、肯定的に捉えたうえで、データに基づく現状分析を伝えてください。
  - 具体的な根拠（例：「2043年に純資産が黒字化する見込みです」など）を必ず含めてください。
  - 3つのコメントを生成してください。

2. nextActionList:
  - 分析に基づき、次に確認・入力すべき項目を提案してください。
  - アクションを行うことで得られるメリットも併せて記述してください。
  - 「〜を確認してください」「〜の準備を始めましょう」という形式に限定し、質問形式は禁止します。
  - 3つのアクションを生成してください。

3. quizDirectionList:
  - ライフプランデータから特定した「将来の変化点や潜在的リスク」に対し、ユーザーが備えるべき知識や心構えを補完するためのクイズ生成方針を記述してください。
  - 記述形式：「ユーザーは〇〇年頃に△△という状況になるため、☆☆に関する知識を問うクイズを出題し、□□の意識を高める方針とする」といった戦略的な内容にしてください。

\`\`\`tsv
${lifePlanTsv.trimEnd()}
\`\`\``;

  return queryGemini(aiCommentJsonSchemaForLlm, prompt);
}
