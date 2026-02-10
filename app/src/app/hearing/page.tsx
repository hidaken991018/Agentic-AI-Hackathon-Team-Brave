"use client";
import { useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import _ from "lodash";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { AutoFillControls } from "@/components/devTools/AutoFillControls";
import { DynamicFormField } from "@/components/hearingForm/DynamicFormField";
import { StepBar } from "@/components/hearingForm/StepBar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { CONSTS } from "@/consts";
import { useAuth } from "@/context/AuthContext";
import { useHearing } from "@/context/HearingContext";
import { authenticatedFetch } from "@/libs/api/hearingApi";
import { useAutoFill } from "@/libs/devUtils/autoFill";
import { generateZodSchema } from "@/libs/formUtils/formSchemaGenerator";
import { generateInitialValues } from "@/libs/formUtils/initialValues";
import {
  LifePlanFormData,
  transformToApiPayload,
} from "@/libs/formUtils/transformer";
import { buildHearingJson, extractEstimations, validateHearingJson } from "@/libs/hearing/hearingJsonBuilder";
import { generateOutputSchema } from "@/libs/hearing/outputSchemaGenerator";
import { FlexibleQuestion } from "@/schema/hearingFormSchema";


export default function LifePlanStepForm() {
  // 初回質問用
  const [currentStep, setCurrentStep] = useState(0);

  // Context から状態を取得
  const { sessionId, setSessionId, isSubmitting, setIsSubmitting, error, setError } = useHearing();

  const steps = CONSTS.QUESTIONS;
  const currentStepData = steps[currentStep];
  const { user, isAnonymous } = useAuth();
  const router = useRouter();

  const defaultValues = useMemo(
    () => generateInitialValues(CONSTS.QUESTIONS),
    [],
  );

  // 1. スキーマとフォームの初期化
  const schema = generateZodSchema(steps);

  // 初回質問フォーム
  const initialForm = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues,
    mode: "onChange",
  });

  // 開発用自動入力機能
  const { isEnabled: autoFillEnabled, fillAllSteps, fillCurrentStep, clearForm } = useAutoFill(
    initialForm,
    CONSTS.QUESTIONS
  );

  // 2. 次のステップへ進むハンドラー
  const handleNext = async () => {
    const currentValues = initialForm.getValues();

    // 現在のステップの中で、実際に「表示条件を満たしている」質問のIDだけを抽出
    const visibleFields = currentStepData.questions
      .filter((q) => {
        const condition = _.get(q, "condition");
        if (!condition) return true;
        // condition.value と現在の回答が一致するものだけをバリデーション対象にする
        return currentValues[condition.field] === condition.value;
      })
      .map((q) => q.id);

    const isValid = await initialForm.trigger(visibleFields);

    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    } else {
      console.log("エラー中のフィールド:", initialForm.formState.errors);
    }
  };

  // 3. 初回質問最終送信のハンドラー
  const handleInitialSubmit = async (data: LifePlanFormData) => {
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

        if (!currentSessionId) {
          throw new Error("Session ID not returned from API");
        }

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
      console.log("[Hearing] Building hearing JSON from results...");

      const hearingJson = buildHearingJson(
        apiPayload.calculatedData,
        interpretedResults
      );

      console.log("[Hearing] Hearing JSON built:", hearingJson);

      // 5. ヒアリング JSON のバリデーション
      const validation = validateHearingJson(hearingJson);

      if (!validation.success) {
        console.error("[Hearing] Hearing JSON validation failed:", validation.errors);
        setError(`データの検証に失敗しました: ${validation.errors?.join(", ")}`);
        return;
      }

      console.log("[Hearing] Hearing JSON validated successfully");

      // 6. セッションに保存
      const estimations = extractEstimations(interpretedResults);

      console.log("[Hearing] Saving hearing JSON to session...");

      const saveResponse = await authenticatedFetch(
        user,
        "/api/hearing/direct-data",
        {
          method: "POST",
          body: JSON.stringify({
            sessionId: currentSessionId,
            data: {
              hearingJson: validation.data,
              estimations,
              savedAt: new Date().toISOString(),
            },
            invocationId: "hearing",
          }),
        }
      );

      if (!saveResponse.ok) {
        console.error("[Hearing] Failed to save hearing JSON to session");
        setError("データの保存に失敗しました。");
        return;
      }

      console.log("[Hearing] Hearing JSON saved to session successfully");

      // 7. 追加質問ページへリダイレクト
      console.log("[Hearing] Redirecting to additional questions...");
      router.push(`/hearing/additional-questions?sessionId=${currentSessionId}`);
    } catch (error) {
      console.error("[Hearing] Error during submission:", error);
      setError("送信中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ステップバー */}
      <StepBar currentStep={currentStep} steps={steps} />

      {/* 初回質問フォーム */}
      <Form {...initialForm}>
        <form
          onSubmit={initialForm.handleSubmit(
            (data) => {
              handleInitialSubmit(data as LifePlanFormData);
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

      {/* 開発用自動入力コントロール */}
      {autoFillEnabled && (
        <AutoFillControls
          onFillAll={fillAllSteps}
          onFillStep={() => fillCurrentStep(currentStep)}
          onClear={clearForm}
        />
      )}

      {/* 送信中のローディング */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6">
            <p className="text-center">データを解析中...</p>
          </Card>
        </div>
      )}
    </div>
  );
}
