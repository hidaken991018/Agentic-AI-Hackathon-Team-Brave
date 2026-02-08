/**
 * 追加質問取得フック
 *
 * 追加質問の取得と状態管理をカプセル化します。
 */

import { useCallback, useEffect, useState } from "react";

import { User } from "firebase/auth";
import { useRouter } from "next/navigation";

import { useHearing } from "@/context/HearingContext";
import { Question } from "@/services/hearing/schema/additionalQuestionsSchema";

import { fetchAdditionalQuestions } from "../services/additionalQuestionsService";

export interface UseAdditionalQuestionsOptions {
  sessionId: string | null;
  user: User | null;
  initialQuestionCount?: number;
}

export interface UseAdditionalQuestionsReturn {
  /** 追加質問リスト */
  questions: Question[];
  /** 現在の質問ラウンド数 */
  questionCount: number;
  /** ローディング状態 */
  loading: boolean;
  /** エラーメッセージ */
  error: string | null;
  /** 質問を再取得 */
  refetchQuestions: () => Promise<void>;
  /** 質問を直接更新（回答送信後の使用を想定） */
  setQuestions: (questions: Question[]) => void;
  /** 質問ラウンド数を直接更新 */
  setQuestionCount: (count: number) => void;
}

/**
 * 追加質問取得フック
 *
 * @param options - フックオプション
 * @returns 追加質問の状態と再取得関数
 *
 * @example
 * const { questions, questionCount, loading, error } = useAdditionalQuestions({
 *   sessionId,
 *   user,
 *   initialQuestionCount: 0,
 * });
 */
export function useAdditionalQuestions(
  options: UseAdditionalQuestionsOptions
): UseAdditionalQuestionsReturn {
  const { sessionId, user, initialQuestionCount = 0 } = options;
  const router = useRouter();
  const { setError: setContextError } = useHearing();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionCount, setQuestionCount] = useState(initialQuestionCount);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // refetchQuestions: 手動で質問を再取得する場合のみ使用
  const refetchQuestions = useCallback(async () => {
    if (!sessionId || !user) return;

    console.log("[useAdditionalQuestions] Manually refetching questions...");
    setLoading(true);
    setError(null);
    setContextError(null);

    try {
      const data = await fetchAdditionalQuestions({
        sessionId,
        user,
        questionCount, // 現在のquestionCountを使用
      });

      if (data.status === "additional_questions_required") {
        setQuestions(data.questions);
        setQuestionCount(data.questionCount);
        console.log(
          `[useAdditionalQuestions] Loaded ${data.questions.length} questions (round ${data.questionCount})`
        );
      } else if (data.status === "hearing_completed") {
        console.log("[useAdditionalQuestions] Hearing completed, redirecting...");
        router.push(`/life-compass?sessionId=${sessionId}`);
      }
    } catch (err) {
      const errorMessage = "追加質問の取得に失敗しました。";
      console.error("[useAdditionalQuestions] Error fetching questions:", err);
      setError(errorMessage);
      setContextError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sessionId, user, questionCount, router, setContextError]);

  useEffect(() => {
    if (!sessionId || !user) return;

    // 初回マウント時のみ実行
    console.log("[useAdditionalQuestions] Fetching questions (initial mount)...");
    setLoading(true);
    setError(null);
    setContextError(null);

    fetchAdditionalQuestions({
      sessionId,
      user,
      questionCount,
    })
      .then((data) => {
        if (data.status === "additional_questions_required") {
          setQuestions(data.questions);
          setQuestionCount(data.questionCount);
          console.log(
            `[useAdditionalQuestions] Loaded ${data.questions.length} questions (round ${data.questionCount})`
          );
        } else if (data.status === "hearing_completed") {
          console.log("[useAdditionalQuestions] Hearing completed, redirecting...");
          router.push(`/life-compass?sessionId=${sessionId}`);
        }
      })
      .catch((err) => {
        const errorMessage = "追加質問の取得に失敗しました。";
        console.error("[useAdditionalQuestions] Error fetching questions:", err);
        setError(errorMessage);
        setContextError(errorMessage);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionId, user]); // sessionIdとuserのみ依存
  // questionCountは依存配列に含めない(初回値のみ使用)

  return {
    questions,
    questionCount,
    loading,
    error,
    refetchQuestions, // 既に正しい名前
    setQuestions,
    setQuestionCount,
  };
}
