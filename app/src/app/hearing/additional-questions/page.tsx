"use client";

import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { AdditionalQuestionField } from "@/components/hearingForm/AdditionalQuestionField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { useHearing } from "@/context/HearingContext";

// ドメインロジックをインポート
import { useAdditionalQuestions } from "../_components/domain/hooks/useAdditionalQuestions";
import { useAnswerSubmission } from "../_components/domain/hooks/useAnswerSubmission";
import { useSessionIdGuard } from "../_components/domain/hooks/useSessionIdGuard";
import { isAllAnswersEmpty } from "../_components/domain/services/answerValidator";

/**
 * 追加質問ページ
 *
 * AI によるヒアリングの結果、データ不足や不整合が検出された場合に
 * 追加の質問を表示し、回答を収集します。
 */
export default function AdditionalQuestionsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { error } = useHearing();

  const initialQuestionCount = parseInt(
    searchParams.get("questionCount") || "0",
    10
  );

  const form = useForm({
    mode: "onChange",
  });

  // sessionId検証とリダイレクト
  const { sessionId, isReady } = useSessionIdGuard();

  // 追加質問の取得と管理
  const {
    questions,
    questionCount,
    loading,
    error: fetchError,
    setQuestions,
    setQuestionCount,
  } = useAdditionalQuestions({
    sessionId,
    user,
    initialQuestionCount,
  });

  // 回答送信処理
  const { isSubmitting, submitError, submitAnswers } = useAnswerSubmission({
    sessionId,
    user,
    questions,
    questionCount,
    onSuccess: (nextQuestions, nextCount) => {
      // 新しい質問を表示する前にフォームをリセット
      form.reset();
      setQuestions(nextQuestions);
      setQuestionCount(nextCount);
    },
  });

  // 全回答が空かどうかを監視（ボタンラベルの動的切り替え用）
  const watchedValues = form.watch();
  const allEmpty = isAllAnswersEmpty(watchedValues);

  // エラーを統合
  const displayError = error || fetchError || submitError;

  // sessionId検証中
  if (!isReady) {
    return null; // リダイレクト中は何も表示しない
  }

  // ローディング中
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card className="p-6">
          <p className="text-center">質問を読み込み中...</p>
        </Card>
      </div>
    );
  }

  // 質問がない場合
  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card className="p-6">
          <p className="text-center">追加質問はありません。</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* エラー表示 */}
      {displayError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold">追加質問</h1>
        <p className="mt-2 text-gray-600">
          より正確な診断のため、いくつか追加の質問にお答えください。
        </p>
        <p className="mt-1 text-sm text-gray-500">
          質問ラウンド: {questionCount} / 3
        </p>
        <p className="mt-1 text-sm text-blue-600">
          全ての質問は任意です。スキップして次へ進むことも可能です。
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(submitAnswers)}
          className="space-y-8"
        >
          <Card className="border-t-primary border-t-4 p-6">
            <div className="space-y-6">
              {questions.map((question, index) => (
                <AdditionalQuestionField
                  key={question.id}
                  question={question}
                  index={index}
                />
              ))}
            </div>

            <div className="mt-10 flex justify-end border-t pt-6">
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "送信中..."
                  : allEmpty
                    ? "スキップして次へ進む"
                    : "回答を送信"}
              </Button>
            </div>
          </Card>
        </form>
      </Form>

      {/* 送信中のローディング */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6">
            <p className="text-center">回答を送信中...</p>
          </Card>
        </div>
      )}
    </div>
  );
}
