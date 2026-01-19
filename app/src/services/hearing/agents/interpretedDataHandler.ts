/**
 * 解釈データハンドラー
 *
 * ユーザーの自由記述テキストをGemini APIで解釈し、構造化データに変換するためのハンドラーモジュール。
 * 推定が必要な項目については、推定値と推定根拠も生成する。
 *
 * @module interpretedDataHandler
 */

import { withRetry } from "@/libs/common/retryUtility";
import { queryGemini } from "@/libs/google/queryGemini";
import { appendSessionData } from "@/libs/google/sessionManager";
import {
  DEFAULT_ESTIMATION_TARGETS,
  type Estimation,
  type InterpretedDataRequest,
  type InterpretedDataResponse,
  type JsonSchema,
} from "@/services/hearing/schema/interpretedDataSchema";

/**
 * ハンドラーエラーの型定義
 *
 * セッション関連エラー、サービスエラー、Geminiエラーを区別する
 */
export type InterpretedHandlerError =
  | { type: "session"; errorType: "expired" | "not_found" }
  | { type: "service"; message: string; details?: string }
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
 * 解釈データ処理用のGeminiプロンプトを構築する
 *
 * @param content - ユーザーの入力テキスト
 * @param estimationTargets - 推定対象の項目リスト
 * @param outputSchema - 出力スキーマ定義
 * @returns Gemini API用のプロンプト文字列
 */
function buildInterpretationPrompt(
  content: string,
  estimationTargets: string[],
  outputSchema: JsonSchema,
): string {
  const schemaDescription = Object.entries(outputSchema.properties)
    .map(([key, prop]) => `- ${key}: ${prop.description || prop.type}`)
    .join("\n");

  return `
あなたはファイナンシャルプランナーのアシスタントです。
以下のユーザー入力から情報を解釈し、構造化データを生成してください。

## ユーザー入力
${content}

## 出力スキーマ
以下の形式でJSONを生成してください：
${schemaDescription}

## 推定対象項目
以下の項目について、ユーザー入力から直接得られない場合は推定値を算出してください：
${estimationTargets.map((t) => `- ${t}`).join("\n")}

推定を行う場合は、推定の根拠（reasoning）も含めてください。

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
 * 解釈データ処理のビジネスロジックを処理する
 *
 * 処理フロー:
 * 1. 推定対象が指定されていない場合はデフォルト値を適用
 * 2. リトライ機能付きでGemini APIを呼び出し、解釈データを処理
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

  // 1. 推定対象が指定されていない場合はデフォルト値を適用
  const estimationTargets: string[] =
    request.estimationTargets && request.estimationTargets.length > 0
      ? request.estimationTargets
      : [...DEFAULT_ESTIMATION_TARGETS];

  // 2. リトライ機能付きでGemini APIを呼び出し、解釈データを処理
  const prompt = buildInterpretationPrompt(
    request.content,
    estimationTargets,
    request.outputSchema,
  );

  const geminiResponseSchema = buildGeminiResponseSchema(
    request.outputSchema,
    estimationTargets,
  );

  const geminiResult = await withRetry(
    async () => {
      const responseText = await queryGemini(geminiResponseSchema, prompt);
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

  // 3. セッションに構造化データを保存（リトライは axiosClient で一元管理）
  // REST API では期限切れセッションが自動削除されるため、
  // 失敗した場合は一律 not_found として扱う
  const storeResult = await appendSessionData(sessionId, {
    interpretedData: structuredData,
    estimations,
    processedAt: new Date().toISOString(),
  });

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
