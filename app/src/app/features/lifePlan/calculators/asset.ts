import {
  calculateAge,
  compoundGrowth,
  formatNumber,
  toNumberArray,
} from "../utils";

import type {
  AssetManagementOutput,
  AssetsOutput,
  ExpenditureOutput,
  HearingJson,
  IncomeOutput,
} from "../types";

interface AssetCalculationParams {
  hearing: HearingJson;
  years: number[];
  income: IncomeOutput;
  expenditure: ExpenditureOutput;
  debtRepayment: number[]; // 年間のローン返済額
}

/**
 * 年間投資額を計算（投資積立）
 */
function calculateYearlyInvestment(
  hearing: HearingJson,
  years: number[],
): number[] {
  const investment = hearing.assets.planedInvestments;
  const userBirthYear = hearing.basicProfile.user.birthYear;

  return years.map((year) => {
    const age = calculateAge(userBirthYear, year);
    if (age > investment.endAge) return 0;
    return investment.monthlyAmount * 12;
  });
}

/**
 * 計画貯蓄額を計算
 */
function calculatePlannedSaving(
  hearing: HearingJson,
  years: number[],
  baseYear: number,
): number[] {
  const saving = hearing.assets.planedSaving;
  const userBirthYear = hearing.basicProfile.user.birthYear;

  return years.map((year) => {
    const age = calculateAge(userBirthYear, year);
    if (age > saving.endAge) return 0;

    const yearsElapsed = year - baseYear;
    return compoundGrowth(
      saving.currentMonthlyAmount * 12,
      saving.growthRate,
      yearsElapsed,
    );
  });
}

/**
 * 投資資産の残高を計算（複利成長）
 */
function calculateInvestmentAssets(
  hearing: HearingJson,
  years: number[],
  yearlyInvestments: number[],
): number[] {
  const returnRate = hearing.economic_assumption.investmentReturnRate;
  const initialInvestment = hearing.assets.current.investments;

  const assets: number[] = [];
  let previousAsset = initialInvestment;

  for (let i = 0; i < years.length; i++) {
    // 前年資産 × (1 + returnRate) + 今年の投資額
    const currentAsset =
      previousAsset * (1 + returnRate) + yearlyInvestments[i];
    assets.push(currentAsset);
    previousAsset = currentAsset;
  }

  return assets;
}

/**
 * 貯蓄残高を計算
 */
function calculateSavingBalance(
  hearing: HearingJson,
  years: number[],
  plannedSaving: number[],
  incomeSummary: number[],
  expenditureSummary: number[],
  yearlyInvestments: number[],
  debtRepayment: number[],
): { balance: number[]; diff: number[] } {
  const initialCash = hearing.assets.currentCash;

  const balance: number[] = [];
  const diff: number[] = [];
  let previousBalance = initialCash;

  for (let i = 0; i < years.length; i++) {
    // 収支差額 = 収入 - 支出 - 投資積立 - ローン返済
    const yearlyDiff =
      incomeSummary[i] -
      expenditureSummary[i] -
      yearlyInvestments[i] -
      debtRepayment[i];

    diff.push(yearlyDiff);

    // 貯蓄残高 = 前年残高 + 計画貯蓄 + 収支差額
    const currentBalance = previousBalance + plannedSaving[i] + yearlyDiff;
    balance.push(currentBalance);
    previousBalance = currentBalance;
  }

  return { balance, diff };
}

/**
 * 資産運用（投資積立・貯蓄）を計算
 */
export function calculateAssetManagement(
  params: AssetCalculationParams,
): AssetManagementOutput {
  const { hearing, years, income, expenditure, debtRepayment } = params;
  const baseYear = years[0];

  // 年間投資額
  const yearlyInvestments = calculateYearlyInvestment(hearing, years);

  // 計画貯蓄額
  const plannedSaving = calculatePlannedSaving(hearing, years, baseYear);

  // 収支計算用の数値配列
  const incomeSummary = toNumberArray(income.summary);
  const expenditureSummary = toNumberArray(expenditure.summary);

  // 貯蓄残高と収支差額
  const { diff } = calculateSavingBalance(
    hearing,
    years,
    plannedSaving,
    incomeSummary,
    expenditureSummary,
    yearlyInvestments,
    debtRepayment,
  );

  // サマリー = 投資積立 + 計画貯蓄 + 収支差額
  const summary = years.map((_, i) => {
    return yearlyInvestments[i] + plannedSaving[i] + diff[i];
  });

  return {
    investmentAssets: yearlyInvestments.map(formatNumber),
    savingInput: {
      planed: plannedSaving.map(formatNumber),
      diff: diff.map(formatNumber),
    },
    summary: summary.map(formatNumber),
  };
}

/**
 * 資産残高を計算
 */
export function calculateAssets(params: AssetCalculationParams): AssetsOutput {
  const { hearing, years, income, expenditure, debtRepayment } = params;
  const baseYear = years[0];

  // 年間投資額
  const yearlyInvestments = calculateYearlyInvestment(hearing, years);

  // 計画貯蓄額
  const plannedSaving = calculatePlannedSaving(hearing, years, baseYear);

  // 投資資産残高
  const investmentAssets = calculateInvestmentAssets(
    hearing,
    years,
    yearlyInvestments,
  );

  // 収支計算用の数値配列
  const incomeSummary = toNumberArray(income.summary);
  const expenditureSummary = toNumberArray(expenditure.summary);

  // 貯蓄残高
  const { balance: savingBalance } = calculateSavingBalance(
    hearing,
    years,
    plannedSaving,
    incomeSummary,
    expenditureSummary,
    yearlyInvestments,
    debtRepayment,
  );

  // 資産サマリー = 投資資産 + 貯蓄
  const summary = years.map((_, i) => {
    return investmentAssets[i] + savingBalance[i];
  });

  return {
    investmentAssets: investmentAssets.map(formatNumber),
    saving: savingBalance.map(formatNumber),
    summary: summary.map(formatNumber),
  };
}
