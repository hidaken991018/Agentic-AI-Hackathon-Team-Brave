import { PENSION_RATE, PENSION_START_AGE } from "../constants";
import {
  calculateAge,
  compoundGrowth,
  formatNumber,
  isAgeInRange,
} from "../utils";

import type { HearingJson, IncomeOutput, PersonIncome } from "../types";

interface IncomeCalculationParams {
  hearing: HearingJson;
  years: number[];
}

/**
 * 個人の収入を計算
 */
function calculatePersonIncome(
  personIncome: PersonIncome | undefined,
  birthYear: number,
  years: number[],
  baseYear: number,
): { incomeList: number[]; lastWorkingIncome: number } {
  if (!personIncome) {
    return { incomeList: years.map(() => 0), lastWorkingIncome: 0 };
  }

  const incomeList: number[] = [];
  let lastWorkingIncome = 0;
  let retirementAge = 0;

  // 退職年齢を特定（最も遅い終了年齢）
  for (const stable of personIncome.stableIncomeList) {
    if (stable.endAge > retirementAge) {
      retirementAge = stable.endAge;
    }
  }

  for (const year of years) {
    const age = calculateAge(birthYear, year);
    let yearlyIncome = 0;

    // 安定収入の計算
    for (const stable of personIncome.stableIncomeList) {
      if (isAgeInRange(age, stable.startAge, stable.endAge)) {
        // 勤続年数を計算（startAgeからの経過年数）
        const yearsWorked = age - stable.startAge;
        const income = compoundGrowth(
          stable.initialAmount,
          stable.growthRate,
          yearsWorked,
        );
        yearlyIncome += income;

        // 退職直前の収入を記録
        if (age === stable.endAge) {
          lastWorkingIncome = Math.max(lastWorkingIncome, income);
        }
      }
    }

    // 一時収入の計算
    for (const temp of personIncome.temporaryIncomeList) {
      if (temp.occurYear === year) {
        yearlyIncome += temp.amount;
      }
    }

    // 年金の計算（退職後）
    if (age >= PENSION_START_AGE && age > retirementAge) {
      // 年金額 = 退職時収入の一定割合
      // 退職時収入がまだ計算されていない場合は推定
      if (lastWorkingIncome === 0) {
        // 退職時の収入を推定
        for (const stable of personIncome.stableIncomeList) {
          const yearsWorked = stable.endAge - stable.startAge;
          const estimatedIncome = compoundGrowth(
            stable.initialAmount,
            stable.growthRate,
            yearsWorked,
          );
          lastWorkingIncome = Math.max(lastWorkingIncome, estimatedIncome);
        }
      }
      yearlyIncome += lastWorkingIncome * PENSION_RATE;
    }

    incomeList.push(yearlyIncome);
  }

  return { incomeList, lastWorkingIncome };
}

/**
 * 収入を計算
 */
export function calculateIncome(params: IncomeCalculationParams): IncomeOutput {
  const { hearing, years } = params;
  const baseYear = years[0];

  // ユーザーの収入
  const userResult = calculatePersonIncome(
    hearing.income.user,
    hearing.basicProfile.user.birthYear,
    years,
    baseYear,
  );

  // パートナーの収入
  const partnerResult = calculatePersonIncome(
    hearing.income.partner,
    hearing.basicProfile.partner?.birthYear ?? 0,
    years,
    baseYear,
  );

  // サマリー
  const summary = years.map((_, i) => {
    return formatNumber(userResult.incomeList[i] + partnerResult.incomeList[i]);
  });

  return {
    user: userResult.incomeList.map(formatNumber),
    partner: partnerResult.incomeList.map(formatNumber),
    summary,
  };
}

/**
 * 退職時の収入を取得（年金計算用）
 */
export function getLastWorkingIncome(
  personIncome: PersonIncome | undefined,
): number {
  if (!personIncome) return 0;

  let maxIncome = 0;
  for (const stable of personIncome.stableIncomeList) {
    const yearsWorked = stable.endAge - stable.startAge;
    const income = compoundGrowth(
      stable.initialAmount,
      stable.growthRate,
      yearsWorked,
    );
    maxIncome = Math.max(maxIncome, income);
  }
  return maxIncome;
}
