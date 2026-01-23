"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { DynamicFormField } from "@/components/hearingForm/DynamicFormField";
import { StepBar } from "@/components/hearingForm/StepBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { generateZodSchema } from "@/libs/formUtils/formSchemaGenerator";
import questionsData from "@/libs/formUtils/questions.json";
import {
  generateDefaultValues,
  transformToApiPayload,
} from "@/libs/formUtils/transformer";
import { Step } from "@/schema/hearingFromScheme";

export default function LifePlanStepForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const steps: Step[] = questionsData as Step[];
  const currentStepData = steps[currentStep];

  const defaultValues = useMemo(
    () => generateDefaultValues(questionsData),
    [questionsData],
  );

  // 1. スキーマとフォームの初期化
  const schema = generateZodSchema(steps);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues,
    mode: "onChange", // 入力のたびにバリデーションを走らせる設定
  });

  // 2. 次のステップへ進むハンドラー
  const handleNext = async () => {
    const currentValues = form.getValues();

    // 現在のステップの中で、実際に「表示条件を満たしている」質問のIDだけを抽出
    const visibleFields = currentStepData.questions
      .filter((q) => {
        if (!q.condition) return true;
        // condition.value と現在の回答が一致するものだけをバリデーション対象にする
        return currentValues[q.condition.field] === q.condition.value;
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
  const onSubmit = (data: Record<string, unknown>) => {
    console.log("最終確定データ:", data);
    // 1. フォームのフラットなデータをAPI用ネスト構造に変換
    const apiPayload = transformToApiPayload(data, questionsData);
    console.log("API用ペイロード:", apiPayload);
    // ここで回答データを使った処理を行う
    alert("ライフプランの入力が完了しました！");
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <StepBar currentStep={currentStep} steps={steps} />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(
            (data) => {
              onSubmit(data);
            },
            (errors) => {
              // 送信できない原因がここに出力されます
              console.error(
                "バリデーションエラーで送信に失敗しました:",
                errors,
              );
            },
          )}
          className="space-y-8"
        >
          {/* <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8"> */}
          <Card className="border-t-primary border-t-4 p-6">
            <div className="space-y-6">
              {currentStepData.questions.map((q) => (
                <DynamicFormField key={q.id} question={q} />
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
                  type="submit"
                  className="bg-destructive hover:bg-destructive/90"
                >
                  この内容で診断する
                </Button>
              ) : (
                <Button type="button" onClick={handleNext}>
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
