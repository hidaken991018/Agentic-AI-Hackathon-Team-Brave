/**
 * 自動入力機能のReactフック
 */

import { useEffect, useState } from "react";

import { UseFormReturn } from "react-hook-form";

import { StepData } from "@/schema/hearingFormSchema";

import { AutoFillEngine } from "./autoFillEngine";

interface UseAutoFillReturn {
  isEnabled: boolean;
  fillAllSteps: (persona?: string) => void;
  fillCurrentStep: (stepIndex: number) => void;
  clearForm: () => void;
}

/**
 * 自動入力機能のフック
 */
export function useAutoFill(
  form: UseFormReturn,
  steps: readonly StepData[],
): UseAutoFillReturn {
  const [isEnabled, setIsEnabled] = useState(false);

  // 関数を useEffect の前に定義
  const fillAllSteps = (persona: string = "single") => {
    console.log(`[AutoFill] Filling all steps with persona: ${persona}`);
    const engine = new AutoFillEngine();
    engine.fillForm(steps, form, { persona });
  };

  const fillCurrentStep = (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= steps.length) {
      console.warn(`[AutoFill] Invalid step index: ${stepIndex}`);
      return;
    }

    console.log(`[AutoFill] Filling step ${stepIndex + 1}`);
    const engine = new AutoFillEngine();
    engine.fillStep(steps[stepIndex], form);
  };

  const clearForm = () => {
    console.log("[AutoFill] Clearing form");
    form.reset();
  };

  useEffect(() => {
    // 環境チェック
    if (process.env.NODE_ENV !== "development") {
      console.log("[AutoFill] Disabled: not in development mode");
      return;
    }

    if (process.env.NEXT_PUBLIC_ENABLE_AUTOFILL !== "true") {
      console.log(
        "[AutoFill] Disabled: NEXT_PUBLIC_ENABLE_AUTOFILL is not true",
      );
      return;
    }

    setIsEnabled(true);
    console.log("[AutoFill] Enabled");

    // キーボードショートカット登録
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (e.key === "A" || e.key === "a") {
          e.preventDefault();
          console.log("[AutoFill] Keyboard shortcut: Fill all steps");
          fillAllSteps();
        } else if (e.key === "C" || e.key === "c") {
          e.preventDefault();
          console.log("[AutoFill] Keyboard shortcut: Clear form");
          clearForm();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isEnabled,
    fillAllSteps,
    fillCurrentStep,
    clearForm,
  };
}
