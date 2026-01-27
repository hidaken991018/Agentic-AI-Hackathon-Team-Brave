"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import _ from "lodash";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { DynamicFormField } from "@/components/hearingForm/DynamicFormField";
import { StepBar } from "@/components/hearingForm/StepBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { CONSTS } from "@/consts";
import { useAuth } from "@/context/AuthContext";
import { authenticatedFetch } from "@/libs/api/hearingApi";
import { generateZodSchema } from "@/libs/formUtils/formSchemaGenerator";
import {
  generateDefaultValues,
  LifePlanFormData,
  transformToApiPayload,
} from "@/libs/formUtils/transformer";
import { generateOutputSchema } from "@/libs/hearing/outputSchemaGenerator";
import { FlexibleQuestion } from "@/schema/hearingFormSchema";
import { HearingJsonInput } from "@/schema/hearingJson/hearingJsonSchema";

export default function LifePlanStepForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId, setSessionId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const steps = CONSTS.QUESTIONS;
  const currentStepData = steps[currentStep];
  const { user, isAnonymous } = useAuth();
  const router = useRouter();

  const defaultValues: Partial<HearingJsonInput> = useMemo(
    () => generateDefaultValues(CONSTS.QUESTIONS),
    [],
  );

  // 1. スキーマとフォームの初期化
  const schema = generateZodSchema(steps);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues,
    mode: "onChange",
  });

  // 2. 次のステップへ進むハンドラー
  const handleNext = async () => {
    const currentValues = form.getValues();

    // 現在のステップの中で、実際に「表示条件を満たしている」質問のIDだけを抽出
    const visibleFields = currentStepData.questions
      .filter((q) => {
        const condition = _.get(q, "condition");
        if (!condition) return true;
        // condition.value と現在の回答が一致するものだけをバリデーション対象にする
        return currentValues[condition.field] === condition.value;
      })
      .map((q) => q.id);

    const isValid = await form.trigger(visibleFields);

    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    } else {
      console.log("エラー中のフィールド:", form.formState.errors);
    }
  };

  // 3. 最終送信のハンドラー
  const onSubmit = async (data: LifePlanFormData) => {
    console.log("[Hearing] 最終確定データ:", data);
    console.log("[Hearing] User ID:", user?.uid);
    console.log("[Hearing] Is Anonymous:", isAnonymous);

    if (!user) {
      alert("ログインが必要です。");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. AI Agent セッション作成（初回のみ）
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        console.log("[Hearing] Creating new AI agent session...");

        const sessionResponse = await authenticatedFetch(
          user,
          "/api/ai-agent/session",
          {
            method: "POST",
            body: JSON.stringify({}),
          },
        );

        if (!sessionResponse.ok) {
          throw new Error("Failed to create AI agent session");
        }

        const sessionData = await sessionResponse.json();
        currentSessionId = sessionData.sessionId;
        setSessionId(currentSessionId);
        console.log("[Hearing] AI agent session created:", currentSessionId);
      }

      // 2. データ変換
      const apiPayload = transformToApiPayload(data, CONSTS.QUESTIONS);
      console.log("[Hearing] API用ペイロード:", apiPayload);

      // 3. aiContext の各項目を interpreted-data API に直列送信
      const interpretedResults = [];
      const itemsToProcess = apiPayload.aiContext
        .filter((item) => item.related && item.related.length > 0);

      console.log(`[Hearing] Processing ${itemsToProcess.length} items sequentially...`);

      for (const item of itemsToProcess) {
        // outputSchema を動的生成
        const outputSchema = generateOutputSchema(item.related);

        console.log(
          `[Hearing] Sending interpreted-data API for: ${item.label}`,
        );

        // API 呼び出し（直列）
        const response = await authenticatedFetch(
          user,
          "/api/hearing/interpreted-data",
          {
            method: "POST",
            body: JSON.stringify({
              // userId を削除
              sessionId: currentSessionId,
              content: `${item.label}: ${item.answer}`,
              estimationTargets: item.related,
              outputSchema,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        const result = await response.json();
        interpretedResults.push(result);

        console.log(`[Hearing] Completed: ${item.label}`);
      }

      console.log("[Hearing] All interpreted results:", interpretedResults);

      // 4. ヒアリング JSON 構築
      // TODO: calculatedData + AI推論結果をマージ
      // const hearingJson = {
      //   ...apiPayload.calculatedData,
      //   // AI推論結果を適切なフィールドにマッピング
      // };

      // 5. 追加質問取得
      console.log("[Hearing] Fetching additional questions...");
      const additionalQuestionsResponse = await authenticatedFetch(
        user,
        "/api/hearing/additional-questions",
        {
          method: "POST",
          body: JSON.stringify({
            // userId を削除
            sessionId: currentSessionId,
            questionCount: 0, // 初回は0
          }),
        },
      );

      if (!additionalQuestionsResponse.ok) {
        throw new Error(
          `Additional Questions API Error: ${additionalQuestionsResponse.statusText}`,
        );
      }

      const additionalQuestionsData =
        await additionalQuestionsResponse.json();
      console.log("[Hearing] Additional questions response:", additionalQuestionsData);

      // 6. レスポンス処理 - 別ページに遷移
      if (additionalQuestionsData.status === "additional_questions_required") {
        // 追加質問ページに遷移（sessionId と questionCount を渡す）
        const params = new URLSearchParams({
          sessionId: currentSessionId,
          questionCount: additionalQuestionsData.questionCount.toString(),
        });
        router.push(`/hearing/additional-questions?${params}`);
      } else if (additionalQuestionsData.status === "hearing_completed") {
        // ヒアリング完了 - 結果ページへ遷移
        router.push(`/hearing/result?sessionId=${currentSessionId}`);
      }
    } catch (error) {
      console.error("[Hearing] Error during submission:", error);
      alert("送信中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <StepBar currentStep={currentStep} steps={steps} />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(
            (data) => {
              onSubmit(data as LifePlanFormData);
            },
            (errors) => {
              console.error(
                "バリデーションエラーで送信に失敗しました:",
                errors,
              );
            },
          )}
          className="space-y-8"
        >
          <Card className="border-t-primary border-t-4 p-6">
            <div className="space-y-6">
              {currentStepData.questions.map((q) => (
                <DynamicFormField key={q.id} question={q as FlexibleQuestion} />
              ))}
            </div>

            <div className="mt-10 flex justify-between border-t pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentStep((s) => s - 1)}
                disabled={currentStep === 0}
              >
                戻る
              </Button>

              {isLastStep ? (
                <Button
                  key="submit-btn"
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "送信中..." : "この内容で診断する"}
                </Button>
              ) : (
                <Button key="next-btn" type="button" onClick={handleNext}>
                  次へ進む
                </Button>
              )}
            </div>
          </Card>
        </form>
      </Form>
    </div>
  );
}
