/**
 * 自動入力エンジン
 * 2パスアルゴリズムで条件付きフィールドを適切に処理
 */

import _ from "lodash";
import { UseFormReturn } from "react-hook-form";

import { FlexibleQuestion, StepData } from "@/schema/hearingFormSchema";

import { FieldFiller } from "./fieldFillers";
import { getPersonaData } from "./testData";
import { PersonaData } from "./types";

interface FillOptions {
  persona?: string;
}

export class AutoFillEngine {
  private filler = new FieldFiller();

  /**
   * フォーム全体を自動入力
   */
  fillForm(
    steps: readonly StepData[],
    form: UseFormReturn<any>,
    options: FillOptions = {},
  ): void {
    const personaData = this.getPersonaData(options.persona);

    console.log("[AutoFill] Starting form fill with persona:", options.persona);

    // Pass 1: 条件なしフィールドと条件トリガーフィールド
    console.log("[AutoFill] Pass 1: Filling unconditional fields");
    this.fillUnconditionalFields(steps, form, personaData);

    // フォームの値を再評価（条件評価のため）
    const currentValues = form.getValues();
    console.log("[AutoFill] Current values after pass 1:", currentValues);

    // Pass 2: 条件付きフィールド
    console.log("[AutoFill] Pass 2: Filling conditional fields");
    this.fillConditionalFields(steps, form, personaData);

    console.log("[AutoFill] Form fill completed");
  }

  /**
   * 特定のステップのみ自動入力
   */
  fillStep(
    step: StepData,
    form: UseFormReturn<any>,
    options: FillOptions = {},
  ): void {
    const personaData = this.getPersonaData(options.persona);

    console.log(`[AutoFill] Filling step ${step.step}: ${step.stepTitle}`);

    // Pass 1: 条件なしフィールド
    step.questions.forEach((q) => {
      const flexQ = q as FlexibleQuestion;
      if (!flexQ.condition) {
        this.fillQuestion(flexQ, form, personaData);
      }
    });

    // Pass 2: 条件付きフィールド
    step.questions.forEach((q) => {
      const flexQ = q as FlexibleQuestion;
      if (flexQ.condition) {
        const shouldShow = this.evaluateCondition(
          flexQ.condition,
          form.getValues(),
        );
        if (shouldShow) {
          this.fillQuestion(flexQ, form, personaData);
        }
      }
    });

    console.log(`[AutoFill] Step ${step.step} fill completed`);
  }

  /**
   * Pass 1: 条件なしフィールドを入力
   */
  private fillUnconditionalFields(
    steps: readonly StepData[],
    form: UseFormReturn<any>,
    personaData: PersonaData,
  ): void {
    steps.forEach((step) => {
      step.questions.forEach((q) => {
        const flexQ = q as FlexibleQuestion;
        if (!flexQ.condition) {
          this.fillQuestion(flexQ, form, personaData);
        }
      });
    });
  }

  /**
   * Pass 2: 条件付きフィールドを入力
   */
  private fillConditionalFields(
    steps: readonly StepData[],
    form: UseFormReturn<any>,
    personaData: PersonaData,
  ): void {
    steps.forEach((step) => {
      step.questions.forEach((q) => {
        const flexQ = q as FlexibleQuestion;
        if (flexQ.condition) {
          const shouldShow = this.evaluateCondition(
            flexQ.condition,
            form.getValues(),
          );
          if (shouldShow) {
            this.fillQuestion(flexQ, form, personaData);
          }
        }
      });
    });
  }

  /**
   * 個別の質問を入力
   */
  private fillQuestion(
    question: FlexibleQuestion,
    form: UseFormReturn<any>,
    personaData: PersonaData,
  ): void {
    if (question.type === "field_array") {
      this.fillFieldArrayQuestion(question, form, personaData);
    } else {
      let value = this.filler.fillField(question, personaData);

      // selectフィールドは文字列に変換（Zodバリデーション対応）
      if (
        (question.type === "select" || question.type === "radio") &&
        value !== null &&
        value !== undefined
      ) {
        value = String(value);
      }

      form.setValue(question.id, value);
      console.log(`[AutoFill] Set ${question.id} = ${value}`);
    }
  }

  /**
   * Field Array タイプの質問を入力
   */
  private fillFieldArrayQuestion(
    question: FlexibleQuestion,
    form: UseFormReturn<any>,
    personaData: PersonaData,
  ): void {
    const arrayData = this.filler.fillField(question, personaData) as any[];

    if (!Array.isArray(arrayData) || arrayData.length === 0) {
      console.log(`[AutoFill] No data for field array: ${question.id}`);
      return;
    }

    console.log(
      `[AutoFill] Filling field array: ${question.id} with ${arrayData.length} entries`,
    );

    // 既存のフォーム値を取得
    const currentValue = form.getValues(question.id) || [];

    // 既存エントリをクリア（最初の1つは残す必要がある場合があるため、全て削除してから追加）
    if (Array.isArray(currentValue)) {
      // 配列を空にする
      form.setValue(question.id, []);
    }

    // 新しいエントリを追加
    const newEntries = arrayData.map((entry) => {
      const entryData: Record<string, any> = {};

      // 各フィールドを処理
      if (question.fields) {
        question.fields.forEach((field) => {
          const fieldMapping = field.mapping || "";
          let value: any = undefined;

          // マッピングに基づいて値を取得
          if (fieldMapping && entry[fieldMapping] !== undefined) {
            value = entry[fieldMapping];

            // selectフィールドは文字列に変換（Zodバリデーション対応）
            if (field.type === "select" || field.type === "radio") {
              value = String(value);
            }
          } else {
            // フォールバック: FieldFillerを使用
            value = this.filler.fillField(field, personaData);
          }

          entryData[field.id] = value;
          console.log(`[AutoFill]   Field ${field.id} = ${value}`);
        });
      }

      return entryData;
    });

    // フォームに設定
    form.setValue(question.id, newEntries);
    console.log(
      `[AutoFill] Set field array ${question.id} with ${newEntries.length} entries`,
    );
  }

  /**
   * 条件を評価
   */
  private evaluateCondition(condition: any, values: any): boolean {
    const fieldValue = _.get(values, condition.field);
    const operator = condition.operator || "===";

    switch (operator) {
      case "===":
        return fieldValue === condition.value;
      case "!==":
        return fieldValue !== condition.value;
      case "in":
        return (
          Array.isArray(condition.value) && condition.value.includes(fieldValue)
        );
      default:
        console.warn(`[AutoFill] Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * ペルソナデータを取得
   */
  private getPersonaData(personaType?: string): PersonaData {
    return getPersonaData(personaType);
  }
}
