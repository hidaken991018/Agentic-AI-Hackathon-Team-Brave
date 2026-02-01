/**
 * AI解釈サービス
 *
 * AI解釈が必要な質問をフィルタリングし、
 * interpreted-data APIへの並列呼び出しを管理します。
 */

import { User } from "firebase/auth";

import { authenticatedFetch } from "@/libs/api/hearingApi";
import { generateOutputSchema } from "@/libs/hearing/outputSchemaGenerator";
import { Question } from "@/services/hearing/schema/additionalQuestionsSchema";
import { InterpretedDataResponse } from "@/services/hearing/schema/interpretedDataSchema";

export interface ProcessAiInterpretationsOptions {
  sessionId: string;
  user: User;
  questions: Question[];
  answers: Record<string, unknown>;
}

/**
 * AI解釈が必要な質問をフィルタリング
 */
function filterInterpretableQuestions(questions: Question[]): Question[] {
  return questions.filter((q) => q.answerMethod.requiresAiInterpretation);
}

/**
 * AI解釈APIを並列実行
 *
 * @param options - 処理オプション
 * @returns AI解釈結果の配列
 * @throws 個別のAPI呼び出しが失敗した場合にエラーをthrow
 */
export async function processAiInterpretations(
  options: ProcessAiInterpretationsOptions,
): Promise<InterpretedDataResponse[]> {
  const { sessionId, user, questions, answers } = options;

  // AI解釈が必要な質問をフィルタリング
  const interpretableQuestions = filterInterpretableQuestions(questions);

  if (interpretableQuestions.length === 0) {
    console.log(
      "[processAiInterpretations] No questions require AI interpretation",
    );
    return [];
  }

  console.log(
    `[processAiInterpretations] Processing ${interpretableQuestions.length} questions with AI interpretation`,
  );

  // 各質問に対してAI解釈APIを並列実行
  const interpretedPromises = interpretableQuestions.map(async (q) => {
    const outputSchema = generateOutputSchema([`#${q.id}`]);

    const response = await authenticatedFetch(
      user,
      "/api/hearing/interpreted-data",
      {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          content: `${q.text}: ${answers[q.id]}`,
          estimationTargets: [`#${q.id}`],
          outputSchema,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`AI Interpretation API Error: ${response.statusText}`);
    }

    return await response.json();
  });

  // 全てのAI解釈が完了するまで待機
  const results = await Promise.all(interpretedPromises);

  console.log("[processAiInterpretations] All AI interpretations completed");

  return results;
}
