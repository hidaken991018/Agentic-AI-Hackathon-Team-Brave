/**
 * 解釈データハンドラー
 *
 * マルチエージェントパイプラインでユーザーの自由記述テキストを処理するハンドラーモジュール。
 * 1. Vertex AI Agent Engine: セッションデータを活用した推論・解釈
 * 2. Gemini API: 推論結果の構造化データ変換
 *
 * @module interpretedDataHandler
 */

import { withRetry } from "@/libs/common/retryUtility";
import { getAccessToken } from "@/libs/google/getAccessToken";
import { queryAIAgent } from "@/libs/google/queryAIAgent";
import { queryGemini } from "@/libs/google/queryGemini";
import { appendSessionData } from "@/libs/google/sessionManager";
import {
  type Estimation,
  type InterpretedDataRequest,
  type InterpretedDataResponse,
  type JsonSchema,
} from "@/services/hearing/schema/interpretedDataSchema";

/**
 * ハンドラーエラーの型定義
 *
 * セッション関連エラー、サービスエラー、Agent Engineエラー、Geminiエラーを区別する
 */
export type InterpretedHandlerError =
  | { type: "session"; errorType: "expired" | "not_found" }
  | { type: "service"; message: string; details?: string }
  | { type: "agent"; originalError: unknown }
  | { type: "gemini"; originalError: unknown };

/**
 * ハンドラー操作の結果型
 *
 * 成功時はInterpretedDataResponseを返し、失敗時はエラー情報を返す
 */
export type InterpretedDataHandlerResult =
  | { success: true; data: InterpretedDataResponse }
  | { success: false; error: InterpretedHandlerError };

/**
 * Vertex AI Agent Engine用の推論プロンプトを構築する
 *
 * セッションに蓄積されたデータを活用して、ユーザー入力を解釈・推論する
 *
 * @param content - ユーザーの入力テキスト
 * @param estimationTargets - 推定対象の項目リスト
 * @returns Vertex AI Agent Engine用のプロンプト文字列
 */
function buildAgentPrompt(
  content: string,
  estimationTargets: string[],
): string {
  return `
あなたはファイナンシャルプランナーのアシスタントです。
セッションに蓄積されたデータとユーザーの入力を総合的に分析し、解釈・推論を行ってください。

## ユーザー入力
${content}

## 推定対象項目
以下の項目について、ユーザー入力やセッションデータから直接得られない場合は推定を行い、その根拠も説明してください：
${estimationTargets.map((t) => `- ${t}`).join("\n")}

## 出力要件
- ユーザー入力から読み取れる情報を整理してください
- 推定が必要な項目については、推定値とその根拠を説明してください
- セッションデータとの整合性を考慮してください
`.trim();
}

/**
 * Gemini API用の構造化プロンプトを構築する
 *
 * Agent Engineの推論結果を構造化データに変換する
 *
 * @param agentResponse - Agent Engineからの推論結果
 * @param estimationTargets - 推定対象の項目リスト
 * @param outputSchema - 出力スキーマ定義
 * @returns Gemini API用のプロンプト文字列
 */
function buildStructuringPrompt(
  agentResponse: string,
  estimationTargets: string[],
  outputSchema: JsonSchema,
): string {
  const schemaDescription = Object.entries(outputSchema.properties)
    .map(([key, prop]) => `- ${key}: ${prop.description || prop.type}`)
    .join("\n");

  return `
以下の解釈・推論結果を構造化データに変換してください。

## 解釈・推論結果
${agentResponse}

## 出力スキーマ
以下の形式でJSONを生成してください：
${schemaDescription}

## 推定対象項目
${estimationTargets.map((t) => `- ${t}`).join("\n")}

## 出力形式
{
  "structuredData": { ... },
  "estimations": {
    "<target>": {
      "value": <推定値>,
      "reasoning": "<推定の根拠>"
    }
  }
}
`.trim();
}

/**
 * Gemini API呼び出し用のレスポンススキーマを構築する
 *
 * Geminiが返す構造を定義するスキーマを生成する
 *
 * @param outputSchema - 構造化データの出力スキーマ
 * @param estimationTargets - 推定対象の項目リスト
 * @returns Gemini APIのレスポンススキーマオブジェクト
 */
function buildGeminiResponseSchema(
  outputSchema: JsonSchema,
  estimationTargets: string[],
) {
  // 推定対象に基づいて推定プロパティを構築
  const estimationProperties: Record<string, unknown> = {};
  for (const target of estimationTargets) {
    estimationProperties[target] = {
      type: "object",
      properties: {
        value: {
          type: "string",
          description: `${target}の推定値`,
        },
        reasoning: {
          type: "string",
          description: "推定の根拠",
        },
      },
      required: ["value"],
    };
  }

  return {
    type: "object",
    properties: {
      structuredData: {
        type: "object",
        properties: outputSchema.properties,
        required: outputSchema.required || [],
      },
      estimations: {
        type: "object",
        properties: estimationProperties,
      },
    },
    required: ["structuredData", "estimations"],
  };
}

/**
 * Geminiのレスポンスをパースして構造化データと推定値を抽出する
 *
 * @param responseText - Gemini APIからのレスポンステキスト
 * @returns 構造化データと推定値を含むオブジェクト
 * @throws JSONパースに失敗した場合にエラーをスロー
 */
function parseGeminiResponse(responseText: string): {
  structuredData: Record<string, unknown>;
  estimations: Record<string, Estimation>;
} {
  try {
    const parsed = JSON.parse(responseText);
    return {
      structuredData: parsed.structuredData || {},
      estimations: parsed.estimations || {},
    };
  } catch (error) {
    console.error(
      "[InterpretedDataHandler] Geminiレスポンスのパースに失敗しました:",
      error,
    );
    throw new Error("Geminiレスポンスを JSON としてパースできませんでした");
  }
}

/**
 * 解釈データ処理のビジネスロジックを処理する（マルチエージェントパイプライン）
 *
 * 処理フロー:
 * 1. Vertex AI Agent Engine でセッションデータを活用した推論・解釈
 * 2. Gemini API で推論結果を構造化データに変換
 * 3. 構造化データをセッションに保存（セッション存在確認も兼ねる）
 * 4. structuredDataとestimationsを含むデータを返却
 *
 * 注意: REST API では期限切れセッションが自動削除されるため、
 *       セッションの事前検証は行わず、appendSessionData の失敗で判定します。
 *
 * @param request - 検証済みのリクエストボディ
 * @returns ハンドラー処理結果（成功時はデータ、失敗時はエラー情報）
 */
export async function handleInterpretedData(
  request: InterpretedDataRequest,
): Promise<InterpretedDataHandlerResult> {
  const sessionId = request.sessionId;
  const estimationTargets = request.estimationTargets;

  // 1. Vertex AI Agent Engine でセッションデータを活用した推論・解釈
  const agentPrompt = buildAgentPrompt(request.content, estimationTargets);

  const agentResult = await withRetry(
    async () => {
      const accessToken = await getAccessToken();
      const response = await queryAIAgent(
        process.env.VERTEX_AGT_LOCATION || "",
        process.env.VERTEX_AGT_RESOURCE_NAME || "",
        accessToken,
        request.userId,
        sessionId,
        agentPrompt,
      );
      if (!response) {
        throw new Error("Agent Engineからのレスポンスが空です");
      }
      return response;
    },
    { maxRetries: 2, initialDelayMs: 1000, backoffMultiplier: 2 },
  );

  if (!agentResult.ok) {
    return {
      success: false,
      error: { type: "agent", originalError: agentResult.error.lastError },
    };
  }

  const agentResponse = agentResult.value;

  // 2. Gemini API で推論結果を構造化データに変換
  const structuringPrompt = buildStructuringPrompt(
    agentResponse,
    estimationTargets,
    request.outputSchema,
  );

  const geminiResponseSchema = buildGeminiResponseSchema(
    request.outputSchema,
    estimationTargets,
  );

  const geminiResult = await withRetry(
    async () => {
      const responseText = await queryGemini(
        geminiResponseSchema,
        structuringPrompt,
      );
      if (!responseText) {
        throw new Error("Gemini APIからのレスポンスが空です");
      }
      return parseGeminiResponse(responseText);
    },
    { maxRetries: 2, initialDelayMs: 1000, backoffMultiplier: 2 },
  );

  if (!geminiResult.ok) {
    return {
      success: false,
      error: { type: "gemini", originalError: geminiResult.error.lastError },
    };
  }

  const { structuredData, estimations } = geminiResult.value;

  const invocationId = "hearing";

  // 3. セッションに構造化データを保存（リトライは axiosClient で一元管理）
  // REST API では期限切れセッションが自動削除されるため、
  // 失敗した場合は一律 not_found として扱う
  const storeResult = await appendSessionData(
    sessionId,
    {
      interpretedData: structuredData,
      estimations,
      processedAt: new Date().toISOString(),
    },
    invocationId,
  );

  if (!storeResult.ok) {
    return {
      success: false,
      error: { type: "session", errorType: "not_found" },
    };
  }

  // 4. 成功データの構築
  const processedAt = new Date().toISOString();
  const responseData: InterpretedDataResponse = {
    success: true,
    sessionId,
    structuredData,
    estimations,
    processedAt,
  };

  return {
    success: true,
    data: responseData,
  };
}
