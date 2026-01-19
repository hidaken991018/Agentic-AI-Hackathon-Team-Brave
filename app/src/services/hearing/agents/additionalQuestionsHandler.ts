/**
 * 追加質問ハンドラー
 *
 * マルチエージェントパイプラインでセッション内のデータを検証し、追加質問を生成するハンドラーモジュール。
 * 1. Vertex AI Agent Engine: セッションデータの整合性・十分性チェック
 * 2. Gemini API: 追加質問の構造化生成
 *
 * @module additionalQuestionsHandler
 */

import { randomUUID } from "crypto";

import { withRetry } from "@/libs/common/retryUtility";
import { getAccessToken } from "@/libs/google/getAccessToken";
import { queryAIAgent } from "@/libs/google/queryAIAgent";
import { queryGemini } from "@/libs/google/queryGemini";
import {
  type AdditionalQuestionsRequest,
  type AdditionalQuestionsResponse,
  type AnswerMethod,
  type Question,
} from "@/services/hearing/schema/additionalQuestionsSchema";

/**
 * 質問ラウンドの最大回数
 */
const MAX_QUESTION_ROUNDS = 3;

/**
 * ハンドラーエラーの型定義
 *
 * セッション関連エラー、Agent Engineエラー、Geminiエラーを区別する
 */
export type AdditionalQuestionsHandlerError =
  | { type: "session"; errorType: "expired" | "not_found" }
  | { type: "agent"; originalError: unknown }
  | { type: "gemini"; originalError: unknown };

/**
 * ハンドラー操作の結果型
 *
 * 成功時はAdditionalQuestionsResponseを返し、失敗時はエラー情報を返す
 */
export type AdditionalQuestionsHandlerResult =
  | { success: true; data: AdditionalQuestionsResponse }
  | { success: false; error: AdditionalQuestionsHandlerError };

/**
 * Gemini APIから生成された質問
 */
interface GeneratedQuestion {
  /** 質問文 */
  text: string;
  /** 推奨される回答数（単一または複数） */
  suggestedAnswerCount: "single" | "multiple";
  /** 推奨される回答形式 */
  suggestedAnswerFormat:
    | "radio"
    | "pulldown"
    | "numeric"
    | "short_text"
    | "long_text";
  /** AI解釈が必要かどうか */
  requiresAiInterpretation: boolean;
  /** 選択肢（ラジオボタンやプルダウンの場合） */
  options?: string[];
}

/**
 * Vertex AI Agent Engine用の整合性チェックプロンプトを構築する
 *
 * @returns Agent Engine用のプロンプト文字列
 */
function buildConsistencyCheckPrompt(): string {
  return `
あなたはファイナンシャルプランナーのアシスタントです。
セッションに蓄積されたデータを分析し、以下の観点でチェックを行ってください。

## チェック項目
1. データの整合性: 矛盾する情報がないか
2. データの十分性: ファイナンシャルプランニングに必要な情報が揃っているか

## 必要な情報の例
- 年齢、家族構成
- 収入、支出
- 資産、負債
- リスク許容度
- 将来の目標（退職年齢、子供の教育費など）

## 出力要件
以下の形式で分析結果を出力してください：
- データに矛盾があるかどうか
- データが十分かどうか
- 矛盾点のリスト（あれば）
- 欠落している情報のリスト（あれば）
`.trim();
}

/**
 * Gemini API用の質問生成プロンプトを構築する
 *
 * @param agentAnalysis - Agent Engineからの分析結果
 * @returns Gemini API用のプロンプト文字列
 */
function buildQuestionGenerationPrompt(agentAnalysis: string): string {
  return `
以下のデータ分析結果に基づいて、ユーザーに追加で質問する項目を生成してください。

## 分析結果
${agentAnalysis}

## 出力要件
欠落している情報や矛盾点を解消するための質問を生成してください。
各質問には適切な回答形式を設定してください。
`.trim();
}

/**
 * 質問生成用のGeminiレスポンススキーマを構築する
 *
 * @returns Gemini APIのレスポンススキーマオブジェクト
 */
function buildQuestionGenerationSchema() {
  return {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "質問文",
            },
            suggestedAnswerCount: {
              type: "string",
              enum: ["single", "multiple"],
              description: "推奨される回答数",
            },
            suggestedAnswerFormat: {
              type: "string",
              enum: ["radio", "pulldown", "numeric", "short_text", "long_text"],
              description: "推奨される回答形式",
            },
            requiresAiInterpretation: {
              type: "boolean",
              description: "AI解釈が必要かどうか",
            },
            options: {
              type: "array",
              items: { type: "string" },
              description: "選択肢（radio/pulldownの場合）",
            },
          },
          required: [
            "text",
            "suggestedAnswerCount",
            "suggestedAnswerFormat",
            "requiresAiInterpretation",
          ],
        },
        description: "生成された質問リスト",
      },
    },
    required: ["questions"],
  };
}

/**
 * Geminiのレスポンスをパースして生成された質問を抽出する
 *
 * @param responseText - Gemini APIからのレスポンステキスト
 * @returns 生成された質問リスト
 */
function parseGeminiResponse(responseText: string): GeneratedQuestion[] {
  try {
    const parsed = JSON.parse(responseText);
    return parsed.questions ?? [];
  } catch (error) {
    console.error(
      "[AdditionalQuestionsHandler] Geminiレスポンスのパースに失敗しました:",
      error,
    );
    throw new Error("Geminiレスポンスを JSON としてパースできませんでした");
  }
}

/**
 * 生成された質問をQuestionスキーマ形式に変換する
 *
 * answerMethodを追加してスキーマに準拠した形式に変換する
 *
 * @param generatedQuestions - 生成された質問のリスト
 * @returns Questionスキーマ形式に変換された質問リスト
 */
function convertToQuestions(generatedQuestions: GeneratedQuestion[]): Question[] {
  return generatedQuestions.map((q) => {
    const answerMethod: AnswerMethod = {
      answerCount: q.suggestedAnswerCount,
      answerFormat: q.suggestedAnswerFormat,
      requiresAiInterpretation: q.requiresAiInterpretation,
      ...(q.options && { options: q.options }),
    };

    return {
      id: randomUUID(),
      text: q.text,
      answerMethod,
    };
  });
}

/**
 * 追加質問生成のビジネスロジックを処理する（マルチエージェントパイプライン）
 *
 * 処理フロー:
 * 1. 質問回数が最大値を超えているかチェック（超えている場合は強制完了）
 * 2. Vertex AI Agent Engine でセッションデータの整合性・十分性を分析
 * 3. Gemini API で分析結果を構造化し、追加質問を生成
 * 4. データが十分な場合はhearing_completedを返却
 * 5. データが不十分または矛盾がある場合は生成された質問を返却
 *
 * @param request - 検証済みのリクエストボディ
 * @returns ハンドラー処理結果（成功時はデータ、失敗時はエラー情報）
 */
export async function handleAdditionalQuestions(
  request: AdditionalQuestionsRequest,
): Promise<AdditionalQuestionsHandlerResult> {
  // 1. 質問回数が最大値を超えているかチェック - 強制完了
  const currentQuestionCount = request.questionCount;
  if (currentQuestionCount >= MAX_QUESTION_ROUNDS) {
    console.log(
      `[AdditionalQuestionsHandler] 最大質問ラウンド数（${MAX_QUESTION_ROUNDS}）に達しました。強制完了します。`,
    );

    const responseData: AdditionalQuestionsResponse = {
      status: "hearing_completed",
      questionCount: currentQuestionCount,
    };

    return {
      success: true,
      data: responseData,
    };
  }

  // 2. Vertex AI Agent Engine でセッションデータの整合性・十分性を分析
  const agentPrompt = buildConsistencyCheckPrompt();

  const agentResult = await withRetry(
    async () => {
      const accessToken = await getAccessToken();
      const response = await queryAIAgent(
        process.env.VERTEX_AGT_LOCATION || "",
        process.env.VERTEX_AGT_RESOURCE_NAME || "",
        accessToken,
        request.userId,
        request.sessionId,
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

  const agentAnalysis = agentResult.value;

  // 3. Gemini API で分析結果を構造化し、追加質問を生成
  const structuringPrompt = buildQuestionGenerationPrompt(agentAnalysis);
  const geminiResponseSchema = buildQuestionGenerationSchema();

  const geminiResult = await withRetry(
    async () => {
      const responseText = await queryGemini(geminiResponseSchema, structuringPrompt);
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
      error: {
        type: "gemini",
        originalError: geminiResult.error.lastError,
      },
    };
  }

  const generatedQuestions = geminiResult.value;

  // 4. 質問が生成されなかった場合はデータが十分と判断し、hearing_completedを返却
  if (generatedQuestions.length === 0) {
    console.log(
      "[AdditionalQuestionsHandler] 追加質問が不要です。ヒアリングを完了します。",
    );

    const responseData: AdditionalQuestionsResponse = {
      status: "hearing_completed",
      questionCount: currentQuestionCount,
    };

    return {
      success: true,
      data: responseData,
    };
  }

  // 5. 生成された質問をQuestionスキーマ形式に変換
  const questions = convertToQuestions(generatedQuestions);
  const newQuestionCount = currentQuestionCount + 1;

  // レスポンスデータの構築
  const responseData: AdditionalQuestionsResponse = {
    status: "additional_questions_required",
    questions,
    questionCount: newQuestionCount,
  };

  return {
    success: true,
    data: responseData,
  };
}
