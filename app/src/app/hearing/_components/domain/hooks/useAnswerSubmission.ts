/**
 * 回答送信フック
 *
 * 回答送信の複雑なオーケストレーションを管理します:
 * 1. AI解釈API並列実行
 * 2. hearingJSON構築
 * 3. セッション保存
 * 4. 次の質問取得
 * 5. 完了判定とリダイレクト
 */

import { useState } from "react";

import { User } from "firebase/auth";
import { useRouter } from "next/navigation";

import { useHearing } from "@/context/HearingContext";
import { Question } from "@/services/hearing/schema/additionalQuestionsSchema";

import { fetchAdditionalQuestions } from "../services/additionalQuestionsService";
import { processAiInterpretations } from "../services/aiInterpretationService";
import { processAndSaveAnswers } from "../services/answerProcessor";
import { isAllAnswersEmpty } from "../services/answerValidator";

export interface UseAnswerSubmissionOptions {
  sessionId: string | null;
  user: User | null;
  questions: Question[];
  questionCount: number;
  onSuccess?: (nextQuestions: Question[], nextCount: number) => void;
}

export interface UseAnswerSubmissionReturn {
  /** 送信中フラグ */
  isSubmitting: boolean;
  /** エラーメッセージ */
  submitError: string | null;
  /** 回答を送信 */
  submitAnswers: (answers: Record<string, unknown>) => Promise<void>;
}

/**
 * 回答送信フック
 *
 * @param options - フックオプション
 * @returns 送信状態と送信関数
 *
 * @example
 * const { isSubmitting, submitError, submitAnswers } = useAnswerSubmission({
 *   sessionId,
 *   user,
 *   questions,
 *   questionCount,
 *   onSuccess: (nextQuestions, nextCount) => {
 *     console.log('Next round:', nextCount);
 *   },
 * });
 */
export function useAnswerSubmission(
  options: UseAnswerSubmissionOptions,
): UseAnswerSubmissionReturn {
  const { sessionId, user, questions, questionCount, onSuccess } = options;
  const router = useRouter();
  const { setError: setContextError } = useHearing();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitAnswers = async (answers: Record<string, unknown>) => {
    if (!sessionId || !user) {
      console.error("[useAnswerSubmission] Missing sessionId or user");
      return;
    }

    // 全回答が空の場合はパイプラインをスキップし、直接ライフコンパスへ遷移
    if (isAllAnswersEmpty(answers)) {
      console.log(
        "[useAnswerSubmission] All answers empty, skipping pipeline",
      );
      router.push(`/life-compass?sessionId=${sessionId}`);
      return;
    }

    console.log("[useAnswerSubmission] Submitting answers:", answers);
    setIsSubmitting(true);
    setSubmitError(null);
    setContextError(null);

    try {
      // 1. AI解釈API並列実行
      console.log("[useAnswerSubmission] Processing AI interpretations...");
      const interpretedResults = await processAiInterpretations({
        sessionId,
        user,
        questions,
        answers,
      });

      console.log("[useAnswerSubmission] AI interpretation completed");
      console.log(
        "[useAnswerSubmission] Interpreted Results:",
        interpretedResults,
      );

      // 2. hearingJSON構築とセッション保存
      console.log("[useAnswerSubmission] Saving answers to session...");
      await processAndSaveAnswers({
        sessionId,
        user,
        interpretedResults,
        questionCount,
      });

      console.log("[useAnswerSubmission] Session saved");

      // 3. 次の質問を取得
      console.log("[useAnswerSubmission] Fetching next questions...");
      const nextQuestionsData = await fetchAdditionalQuestions({
        sessionId,
        user,
        questionCount,
      });

      console.log("[useAnswerSubmission] Next questions fetched");

      // 4. レスポンスに応じて処理を分岐
      if (nextQuestionsData.status === "additional_questions_required") {
        // 新しい質問を表示
        console.log(
          `[useAnswerSubmission] Showing ${nextQuestionsData.questions.length} new questions (round ${nextQuestionsData.questionCount})`,
        );

        if (onSuccess) {
          onSuccess(
            nextQuestionsData.questions,
            nextQuestionsData.questionCount,
          );
        }
      } else if (nextQuestionsData.status === "hearing_completed") {
        // ヒアリング完了 - ライフコンパスページへ遷移
        console.log("[useAnswerSubmission] Hearing completed, redirecting to life-compass...");
        router.push(`/life-compass?sessionId=${sessionId}`);
      }
    } catch (err) {
      const errorMessage = "回答の送信に失敗しました。";
      console.error("[useAnswerSubmission] Error submitting answers:", err);
      setSubmitError(errorMessage);
      setContextError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitError,
    submitAnswers,
  };
}
