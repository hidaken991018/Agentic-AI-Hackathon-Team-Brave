/**
 * 追加質問ハンドラー
 *
 * セッション内のデータの整合性と十分性をチェックし、必要に応じて追加質問を生成するハンドラーモジュール。
 * Agent Engineでデータの検証を行い、Gemini APIで自然言語の質問を生成する。
 *
 * @module additionalQuestionsHandler
 */

import { randomUUID } from "crypto";

import { withRetry } from "@/libs/common/retryUtility";
import { isValidUUIDv4 } from "@/libs/google/sessionManager";
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
 * Agent Engineからのデータ整合性チェック結果
 */
interface ConsistencyCheckResult {
  /** データに矛盾がないかどうか */
  isConsistent: boolean;
  /** データが十分に収集されているかどうか */
  isSufficient: boolean;
  /** 検出された矛盾のリスト */
  inconsistencies: string[];
  /** 欠落しているフィールドのリスト */
  missingFields: string[];
}

/**
 * Gemini APIから生成された質問（answerMethodが追加される前）
 */
interface RawGeneratedQuestion {
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
 * モック: Agent Engineでデータの整合性と十分性をチェックする
 *
 * 本番環境では、実際のAgent Engine APIを呼び出して以下を行う:
 * - セッション内のデータ整合性を検証
 * - 必須フィールドが入力されているかチェック
 * - 矛盾点や欠落情報を特定
 *
 * @param sessionId - 検証対象のセッションID
 * @returns データ整合性チェックの結果
 */
async function checkDataConsistency(
  sessionId: string,
): Promise<ConsistencyCheckResult> {
  // TODO: 実際のAgent Engine API呼び出しに置き換える
  console.log(
    `[AdditionalQuestionsHandler] セッションのデータ整合性をチェック中: ${sessionId}`,
  );

  // モック実装 - Agent Engineのレスポンスをシミュレート
  // 本番環境では実際のAPI呼び出しを行う
  const mockResult: ConsistencyCheckResult = {
    isConsistent: true,
    isSufficient: false, // 追加データが必要であることをシミュレート
    inconsistencies: [],
    missingFields: ["retirement_age", "risk_tolerance"],
  };

  return mockResult;
}

/**
 * モック: Gemini APIを使用して追加質問を生成する
 *
 * 本番環境では、Gemini APIを呼び出して以下を行う:
 * - 欠落フィールドと矛盾点を分析
 * - 自然言語の質問を生成
 * - 適切な回答形式を提案
 *
 * @param consistencyResult - データ整合性チェックの結果
 * @returns 生成された質問のリスト
 */
async function generateQuestionsWithGemini(
  consistencyResult: ConsistencyCheckResult,
): Promise<RawGeneratedQuestion[]> {
  // TODO: 実際のGemini API呼び出しに置き換える
  console.log("[AdditionalQuestionsHandler] Gemini APIで質問を生成中");

  // モック実装 - 欠落フィールドに基づいて質問を生成
  const questions: RawGeneratedQuestion[] = [];

  for (const field of consistencyResult.missingFields) {
    if (field === "retirement_age") {
      questions.push({
        text: "何歳で退職を予定していますか？",
        suggestedAnswerCount: "single",
        suggestedAnswerFormat: "numeric",
        requiresAiInterpretation: false,
      });
    } else if (field === "risk_tolerance") {
      questions.push({
        text: "投資に対するリスク許容度はどの程度ですか？",
        suggestedAnswerCount: "single",
        suggestedAnswerFormat: "radio",
        requiresAiInterpretation: false,
        options: [
          "低リスク（安定重視）",
          "中リスク（バランス型）",
          "高リスク（成長重視）",
        ],
      });
    } else {
      questions.push({
        text: `${field}についてお教えください。`,
        suggestedAnswerCount: "single",
        suggestedAnswerFormat: "short_text",
        requiresAiInterpretation: true,
      });
    }
  }

  // 矛盾点に対する質問を追加
  for (const inconsistency of consistencyResult.inconsistencies) {
    questions.push({
      text: `以下の点について確認させてください：${inconsistency}`,
      suggestedAnswerCount: "single",
      suggestedAnswerFormat: "long_text",
      requiresAiInterpretation: true,
    });
  }

  return questions;
}

/**
 * 生成された質問をQuestionスキーマ形式に変換する
 *
 * answerMethodを追加してスキーマに準拠した形式に変換する
 *
 * @param rawQuestions - 生成された質問のリスト
 * @returns Questionスキーマ形式に変換された質問リスト
 */
function convertToQuestions(rawQuestions: RawGeneratedQuestion[]): Question[] {
  return rawQuestions.map((raw) => {
    const answerMethod: AnswerMethod = {
      answerCount: raw.suggestedAnswerCount,
      answerFormat: raw.suggestedAnswerFormat,
      requiresAiInterpretation: raw.requiresAiInterpretation,
      ...(raw.options && { options: raw.options }),
    };

    return {
      id: randomUUID(),
      text: raw.text,
      answerMethod,
    };
  });
}

/**
 * 追加質問生成のビジネスロジックを処理する
 *
 * 処理フロー:
 * 1. 既存セッションを検証
 * 2. 質問回数が最大値を超えているかチェック（超えている場合は強制完了）
 * 3. Agent Engineにデータの整合性/十分性チェックをリクエスト
 * 4. データが十分な場合はhearing_completedを返却
 * 5. データが不十分または矛盾がある場合はGeminiで質問を生成
 * 6. 生成された質問と共にadditional_questions_requiredを返却
 *
 * @param request - 検証済みのリクエストボディ
 * @returns ハンドラー処理結果（成功時はデータ、失敗時はエラー情報）
 */
export async function handleAdditionalQuestions(
  request: AdditionalQuestionsRequest,
): Promise<AdditionalQuestionsHandlerResult> {
  // 1. セッション ID の形式を検証
  // REST API では期限切れセッションが自動削除されるため、
  // 事前検証は形式チェックのみ行い、実際の存在確認は後続のAPI呼び出しで判定
  if (!isValidUUIDv4(request.sessionId)) {
    return {
      success: false,
      error: { type: "session", errorType: "not_found" },
    };
  }

  // 2. 質問回数が最大値を超えているかチェック - 強制完了
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

  // 3. Agent Engineでデータの整合性/十分性をチェック
  const consistencyResult = await withRetry(
    async () => {
      const result = await checkDataConsistency(request.sessionId);
      return result;
    },
    { maxRetries: 2, initialDelayMs: 1000, backoffMultiplier: 2 },
  );

  if (!consistencyResult.ok) {
    return {
      success: false,
      error: { type: "agent", originalError: consistencyResult.error.lastError },
    };
  }

  const consistencyData = consistencyResult.value;

  // 4. データが十分かつ整合性がある場合はhearing_completedを返却
  if (consistencyData.isSufficient && consistencyData.isConsistent) {
    console.log(
      "[AdditionalQuestionsHandler] データが十分かつ整合性があります。ヒアリングを完了します。",
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

  // 5. Gemini APIで追加質問を生成（リトライ機能付き）
  const questionGenerationResult = await withRetry(
    async () => {
      const rawQuestions = await generateQuestionsWithGemini(consistencyData);
      return rawQuestions;
    },
    { maxRetries: 2, initialDelayMs: 1000, backoffMultiplier: 2 },
  );

  if (!questionGenerationResult.ok) {
    return {
      success: false,
      error: {
        type: "gemini",
        originalError: questionGenerationResult.error.lastError,
      },
    };
  }

  // 6. 生成された質問をQuestionスキーマ形式に変換
  const questions = convertToQuestions(questionGenerationResult.value);
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
