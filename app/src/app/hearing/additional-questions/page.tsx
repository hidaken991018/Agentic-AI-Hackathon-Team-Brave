"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";

import { AdditionalQuestionField } from "@/components/hearingForm/AdditionalQuestionField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { authenticatedFetch } from "@/libs/api/hearingApi";
import { generateOutputSchema } from "@/libs/hearing/outputSchemaGenerator";
import {
  Question,
  AdditionalQuestionsResponse,
} from "@/services/hearing/schema/additionalQuestionsSchema";

/**
 * 追加質問ページ
 *
 * AI によるヒアリングの結果、データ不足や不整合が検出された場合に
 * 追加の質問を表示し、回答を収集します。
 */
export default function AdditionalQuestionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const sessionId = searchParams.get("sessionId");
  const initialQuestionCount = parseInt(
    searchParams.get("questionCount") || "0",
    10,
  );

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionCount, setQuestionCount] = useState(initialQuestionCount);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    mode: "onChange",
  });

  /**
   * 追加質問を取得
   */
  const fetchAdditionalQuestions = useCallback(async () => {
    if (!sessionId || !user) return;

    setLoading(true);

    try {
      const response = await authenticatedFetch(
        user,
        "/api/hearing/additional-questions",
        {
          method: "POST",
          body: JSON.stringify({
            // userId を削除
            sessionId,
            questionCount,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data: AdditionalQuestionsResponse = await response.json();

      if (data.status === "additional_questions_required") {
        setQuestions(data.questions);
        setQuestionCount(data.questionCount);
      } else if (data.status === "hearing_completed") {
        // ヒアリング完了 - 結果ページへ遷移
        router.push(`/hearing/result?sessionId=${sessionId}`);
      }
    } catch (error) {
      console.error("[AdditionalQuestions] Error fetching questions:", error);
      alert("追加質問の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [sessionId, user, questionCount, router]);

  useEffect(() => {
    if (!sessionId || !user) {
      console.error("[AdditionalQuestions] Missing sessionId or user");
      return;
    }

    fetchAdditionalQuestions();
  }, [sessionId, user, fetchAdditionalQuestions]);

  /**
   * 回答を送信
   */
  const handleSubmit = async (data: Record<string, unknown>) => {
    if (!sessionId || !user) return;

    console.log("[AdditionalQuestions] Submitting answers:", data);
    setIsSubmitting(true);

    try {
      // 各質問を requiresAiInterpretation に基づいて振り分け
      const interpretedPromises: Promise<unknown>[] = [];

      for (const question of questions) {
        const answer = data[question.id];

        if (question.answerMethod.requiresAiInterpretation) {
          // interpreted-data API へ送信
          // TODO: estimationTargets の決定ロジックが必要
          // 今回は簡易的に question.id をそのまま使用
          const outputSchema = generateOutputSchema([`#${question.id}`]);

          const promise = authenticatedFetch(
            user,
            "/api/hearing/interpreted-data",
            {
              method: "POST",
              body: JSON.stringify({
                // userId を削除
                sessionId,
                content: `${question.text}: ${answer}`,
                estimationTargets: [`#${question.id}`],
                outputSchema,
              }),
            },
          ).then((res) => {
            if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
            return res.json();
          });

          interpretedPromises.push(promise);
        } else {
          // direct-data API へ送信
          // TODO: direct-data API の実装が必要
          // 今回は簡易的にスキップ
          console.log(
            `[AdditionalQuestions] Direct data for ${question.id}:`,
            answer,
          );
        }
      }

      // 全ての API 呼び出しを並列実行
      await Promise.all(interpretedPromises);

      // 再度 additional-questions API を呼び出し
      const additionalQuestionsResponse = await authenticatedFetch(
        user,
        "/api/hearing/additional-questions",
        {
          method: "POST",
          body: JSON.stringify({
            // userId を削除
            sessionId,
            questionCount,
          }),
        },
      );

      if (!additionalQuestionsResponse.ok) {
        throw new Error(
          `Additional Questions API Error: ${additionalQuestionsResponse.statusText}`,
        );
      }

      const additionalQuestionsData: AdditionalQuestionsResponse =
        await additionalQuestionsResponse.json();

      if (additionalQuestionsData.status === "additional_questions_required") {
        // 新しい質問を表示
        setQuestions(additionalQuestionsData.questions);
        setQuestionCount(additionalQuestionsData.questionCount);
        form.reset(); // フォームをリセット
      } else if (additionalQuestionsData.status === "hearing_completed") {
        // ヒアリング完了 - 結果ページへ遷移
        router.push(`/hearing/result?sessionId=${sessionId}`);
      }
    } catch (error) {
      console.error("[AdditionalQuestions] Error submitting answers:", error);
      alert("回答の送信に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card className="p-6">
          <p className="text-center">質問を読み込み中...</p>
        </Card>
      </div>
    );
  }

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">追加質問</h1>
        <p className="mt-2 text-gray-600">
          より正確な診断のため、いくつか追加の質問にお答えください。
        </p>
        <p className="mt-1 text-sm text-gray-500">
          質問ラウンド: {questionCount} / 3
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
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
                {isSubmitting ? "送信中..." : "回答を送信"}
              </Button>
            </div>
          </Card>
        </form>
      </Form>
    </div>
  );
}
