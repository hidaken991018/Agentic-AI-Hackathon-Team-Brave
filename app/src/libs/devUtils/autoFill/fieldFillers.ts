/**
 * フィールドタイプ別の自動入力処理
 */

import { FlexibleQuestion } from "@/schema/hearingFormSchema";

import { resolveOptions } from "./optionsResolver";
import { PersonaData } from "./types";

export class FieldFiller {
  /**
   * フィールドタイプに応じて適切な値を生成
   */
  fillField(question: FlexibleQuestion, personaData: PersonaData): unknown {
    switch (question.type) {
      case "text":
      case "textarea":
        return this.fillText(question, personaData);
      case "number":
        return this.fillNumber(question, personaData);
      case "select":
      case "radio":
        return this.fillSelect(question, personaData);
      case "field_array":
        return this.fillFieldArray(question, personaData);
      default:
        return "";
    }
  }

  /**
   * テキストフィールドの入力
   */
  private fillText(q: FlexibleQuestion, persona: PersonaData): string {
    const mapping = q.mapping || "";

    // ユーザー名
    if (mapping.includes("user.name")) {
      return persona.user.name;
    }

    // 配偶者名
    if (mapping.includes("partner.name")) {
      return persona.partner?.name || "";
    }

    // 子供の名前（field_array内で使用）
    if (mapping === "name" && q.id.startsWith("q0")) {
      return ""; // field_array処理で埋める
    }

    // 収入概要
    if (mapping === "name" && (q.id === "q22" || q.id === "q31")) {
      return "給与収入";
    }

    // 一時収入概要
    if (mapping === "name" && (q.id === "q27" || q.id === "q37")) {
      return "ボーナス";
    }

    // 保険概要
    if (mapping === "name" && q.id === "q47") {
      return ""; // field_array処理で埋める
    }

    // 保険タイプ
    if (mapping === "type" && q.id === "q48") {
      return "掛け捨て型";
    }

    // イベント名
    if (mapping === "name" && q.id === "q56") {
      return ""; // field_array処理で埋める
    }

    // その他考慮事項（テキストエリア）
    if (q.type === "textarea") {
      return "特になし";
    }

    // デフォルト
    return `テスト回答_${q.id}`;
  }

  /**
   * 数値フィールドの入力
   */
  private fillNumber(q: FlexibleQuestion, persona: PersonaData): number {
    const mapping = q.mapping || "";

    // 収入関連
    if (mapping.includes("income") || q.id === "q21" || q.id === "q30") {
      return 350000;
    }

    // 成長率
    if (mapping.includes("growthRate") || q.id === "q23" || q.id === "q33") {
      return 2.0;
    }

    // 支出関連
    if (mapping.includes("expenses") || mapping.includes("LivingCost")) {
      if (q.id === "q41")
        return persona.expenses?.currentMonthlyLivingCost || 300000;
      if (q.id === "q42") return persona.expenses?.childIndependenceAge || 22;
      if (q.id === "q44" || q.id === "q45")
        return persona.expenses?.currentHousingCost || 100000;
    }

    // 保険料
    if (q.id === "q51") {
      return 50000;
    }

    // 資産関連
    if (mapping.includes("assets")) {
      if (q.id === "q60") return persona.assets?.currentCash || 5000000;
      if (q.id === "q61")
        return persona.assets?.planedSaving?.currentMonthlyAmount || 50000;
      if (q.id === "q63") return persona.assets?.currentInvestments || 1000000;
      if (q.id === "q64")
        return persona.assets?.planedInvestments?.monthlyAmount || 30000;
    }

    // ローン返済額
    if (q.id === "q68") {
      return persona.loans?.[0]?.monthlyRepaymentAmount || 100000;
    }

    // 目標資産額
    if (q.id === "q73") {
      return persona.values?.targetAsset || 50000000;
    }

    // 経済前提
    if (q.id === "q17") return persona.economicAssumption?.inflationRate || 2.0;
    if (q.id === "q18")
      return persona.economicAssumption?.investmentReturnRate || 3.5;

    // イベント支出額
    if (q.id === "q29" || q.id === "q39" || q.id === "q58") {
      return 500000;
    }

    // デフォルト
    return 10000;
  }

  /**
   * セレクト/ラジオフィールドの入力
   */
  private fillSelect(q: FlexibleQuestion, persona: PersonaData): string {
    const mapping = q.mapping || "";
    const options = resolveOptions(q.options);

    // お子様がいるか
    if (q.id === "q05") {
      return persona.hasChildren;
    }

    // 誕生年（ユーザー）
    if (mapping.includes("user.birthYear") || q.id === "q02") {
      return persona.user.birthYear.toString();
    }

    // 誕生年（配偶者）
    if (mapping.includes("partner.birthYear") || q.id === "q04") {
      return persona.partner?.birthYear?.toString() || "";
    }

    // 経済前提の自動算出
    if (q.id === "q14") {
      return persona.economicAssumption?.autoCalculate || "no";
    }

    // 基本スタンス
    if (q.id === "q15") {
      return persona.economicAssumption?.basicStance || "moderate";
    }

    // 年金自動概算
    if (q.id === "q19") {
      return persona.pensionAutoEstimate || "yes";
    }

    // 給与所得年数
    if (q.id === "q20") {
      return "35"; // デフォルト35年
    }

    // 年齢範囲
    if (q.options === "age_range") {
      if (q.id === "q24" || q.id === "q34") return "30"; // 開始年齢
      if (q.id === "q25" || q.id === "q35") return "65"; // 終了年齢
      if (q.id === "q52") return "65"; // 保険終了年齢
      if (q.id === "q62" || q.id === "q65") return "60"; // 貯蓄/投資終了年齢
    }

    // 将来の一時収入
    if (q.id === "q26") {
      return persona.income?.user?.temporaryIncomeList &&
        persona.income.user.temporaryIncomeList.length > 0
        ? "yes"
        : "no";
    }

    // 配偶者の一時収入
    if (q.id === "q36") {
      return persona.income?.partner?.temporaryIncomeList &&
        persona.income.partner.temporaryIncomeList.length > 0
        ? "yes"
        : "no";
    }

    // 給与所得ですか
    if (q.id === "q32") {
      return "yes";
    }

    // 住宅タイプ
    if (q.id === "q43") {
      return persona.expenses?.housingType || "rent";
    }

    // 保険加入
    if (q.id === "q46") {
      return persona.expenses?.insuranceList &&
        persona.expenses.insuranceList.length > 0
        ? "yes"
        : "no";
    }

    // 保険加入者
    if (q.id === "q49") {
      return "self";
    }

    // 保険加入予定
    if (q.id === "q53") {
      return "no";
    }

    // 大きな支出イベント
    if (q.id === "q55") {
      return persona.expenses?.lifeEventList &&
        persona.expenses.lifeEventList.length > 0
        ? "yes"
        : "no";
    }

    // ローン有無
    if (q.id === "q67") {
      return persona.hasLoan;
    }

    // 金利タイプ
    if (q.id === "q69") {
      return persona.loans?.[0]?.interestRateType || "fixed";
    }

    // FPコメントスタンス
    if (q.id === "q74") {
      return persona.values?.commentStance || "standard";
    }

    // 優先順位
    if (q.id === "q75") {
      return persona.values?.priority || "improve_now";
    }

    // 教育タイプ（field_array内で使用）
    if (q.options === "edu_options") {
      return "public"; // デフォルト
    }

    // 年範囲（一時収入・イベント）
    if (q.options === "future_year_range") {
      const currentYear = new Date().getFullYear();
      return (currentYear + 5).toString(); // 5年後
    }

    // 年範囲（子どもの誕生年など）
    if (q.options === "past_and_future_year_range") {
      return "2020";
    }

    // 年範囲（保険加入年等）
    if (q.options === "year_range") {
      return "2020";
    }

    // デフォルト: 最初のオプション
    return options[0]?.value || "";
  }

  /**
   * Field Array の入力
   * 注: このメソッドは配列データを返すが、実際のappendは呼び出し側で行う
   */
  private fillFieldArray(q: FlexibleQuestion, persona: PersonaData): unknown[] {
    const mapping = q.mapping || "";

    // 子供情報
    if (q.id === "children_group" || mapping.includes("childList")) {
      return persona.children || [];
    }

    // 本人の継続収入
    if (
      q.id === "own_income_group" ||
      mapping.includes("user.stableIncomeList")
    ) {
      return persona.income?.user?.stableIncomeList || [];
    }

    // 本人の一時収入
    if (
      q.id === "own_extra_income_group" ||
      mapping.includes("user.temporaryIncomeList")
    ) {
      return persona.income?.user?.temporaryIncomeList || [];
    }

    // 配偶者の継続収入
    if (
      q.id === "partner_income_group" ||
      mapping.includes("partner.stableIncomeList")
    ) {
      return persona.income?.partner?.stableIncomeList || [];
    }

    // 配偶者の一時収入
    if (
      q.id === "partner_extra_income_group" ||
      mapping.includes("partner.temporaryIncomeList")
    ) {
      return persona.income?.partner?.temporaryIncomeList || [];
    }

    // 保険リスト
    if (q.id === "insurance_group" || mapping.includes("insuranceList")) {
      return persona.expenses?.insuranceList || [];
    }

    // ライフイベントリスト
    if (q.id === "event_group" || mapping.includes("lifeEventList")) {
      return persona.expenses?.lifeEventList || [];
    }

    // ローンリスト
    if (q.id === "loan_group" || mapping.includes("loanList")) {
      return persona.loans || [];
    }

    return [];
  }
}
