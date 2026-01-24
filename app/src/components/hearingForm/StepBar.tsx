import { Check } from "lucide-react"; // アイコン用

import { Progress } from "@/components/ui/progress";
import { Step } from "@/schema/hearingFormSchema";

interface StepBarProps {
  currentStep: number;
  steps: Step[];
}

export function StepBar({ currentStep, steps }: StepBarProps) {
  // 進捗率の計算 (0% 〜 100%)
  const progressValue = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="mb-10 w-full space-y-4">
      {/* 1. ステップタイトルの表示 */}
      <div className="relative flex w-full justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div
              key={step.stepTitle}
              className="relative z-10 flex flex-1 flex-col items-center"
            >
              {/* ステップの丸印 */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : isActive
                      ? "border-primary text-primary font-bold"
                      : "bg-background border-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
              </div>

              {/* ステップ名（デスクトップ向け） */}
              <span
                className={`mt-2 text-xs font-medium transition-colors md:text-sm ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {step.stepTitle}
              </span>
            </div>
          );
        })}

        {/* ステップ同士を繋ぐ背景線 */}
        <div className="bg-muted absolute top-4 left-0 -z-0 h-[2px] w-full" />
      </div>

      {/* 2. プログレスバー（スムーズに伸びる線） */}
      <div className="px-2">
        <Progress
          value={progressValue}
          className="h-2 transition-all duration-500"
        />
        <p className="text-muted-foreground mt-1 text-right text-[10px]">
          全体完了率: {Math.round(progressValue)}%
        </p>
      </div>
    </div>
  );
}
