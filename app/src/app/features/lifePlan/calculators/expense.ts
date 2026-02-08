import { EDUCATION_COSTS, SCHOOL_AGE_RANGES } from "../constants";
import {
  calculateAge,
  compoundGrowth,
  formatNumber,
  isAgeInRange,
} from "../utils";

import type {
  Child,
  ExpenditureOutput,
  HearingJson,
  NamedValueList,
} from "../types";

interface ExpenseCalculationParams {
  hearing: HearingJson;
  years: number[];
}

/**
 * 子供の教育費を計算
 */
function calculateChildEducation(
  child: Child,
  years: number[],
  inflationRate: number,
  baseYear: number,
): number[] {
  return years.map((year, idx) => {
    const age = calculateAge(child.birthYear, year);
    if (age < 0) return 0;

    let cost = 0;

    // 各学校段階での教育費
    if (
      isAgeInRange(
        age,
        SCHOOL_AGE_RANGES.primarySchool.start,
        SCHOOL_AGE_RANGES.primarySchool.end,
      )
    ) {
      cost = EDUCATION_COSTS.primarySchool[child.primarySchoolType];
    } else if (
      isAgeInRange(
        age,
        SCHOOL_AGE_RANGES.juniorHighSchool.start,
        SCHOOL_AGE_RANGES.juniorHighSchool.end,
      )
    ) {
      cost = EDUCATION_COSTS.juniorHighSchool[child.juniorHighSchoolType];
    } else if (
      isAgeInRange(
        age,
        SCHOOL_AGE_RANGES.highSchool.start,
        SCHOOL_AGE_RANGES.highSchool.end,
      )
    ) {
      cost = EDUCATION_COSTS.highSchool[child.highSchoolType];
    } else if (
      isAgeInRange(
        age,
        SCHOOL_AGE_RANGES.university.start,
        SCHOOL_AGE_RANGES.university.end,
      )
    ) {
      cost = EDUCATION_COSTS.university[child.universityType];
    } else if (
      isAgeInRange(
        age,
        SCHOOL_AGE_RANGES.graduateSchool.start,
        SCHOOL_AGE_RANGES.graduateSchool.end,
      )
    ) {
      cost = EDUCATION_COSTS.graduateSchool[child.graduateSchoolType];
    }

    return cost;
  });
}

/**
 * 子供の生活費を計算
 */
function calculateChildLivingCost(
  child: Child,
  years: number[],
  baseLivingCost: number[],
  childLivingCostRatio: number,
  childIndependenceAge: number,
): number[] {
  return years.map((year, idx) => {
    const age = calculateAge(child.birthYear, year);
    if (age < 0 || age >= childIndependenceAge) return 0;

    return baseLivingCost[idx] * childLivingCostRatio;
  });
}

/**
 * 基本生活費を計算（インフレ考慮）
 */
function calculateBaseLivingCost(
  monthlyLivingCost: number,
  years: number[],
  inflationRate: number,
  baseYear: number,
): number[] {
  const yearlyBase = monthlyLivingCost * 12;
  return years.map((year) => {
    const yearsElapsed = year - baseYear;
    return compoundGrowth(yearlyBase, inflationRate, yearsElapsed);
  });
}

/**
 * 住居費を計算（インフレ考慮）
 */
function calculateHousingCost(
  currentHousingCost: number,
  years: number[],
  inflationRate: number,
  baseYear: number,
): number[] {
  const yearlyBase = currentHousingCost * 12;
  return years.map((year) => {
    const yearsElapsed = year - baseYear;
    return compoundGrowth(yearlyBase, inflationRate, yearsElapsed);
  });
}

/**
 * 保険料を計算
 */
function calculateInsurance(
  hearing: HearingJson,
  years: number[],
  baseYear: number,
): NamedValueList[] {
  return hearing.expenses.insuranceList.map((insurance) => {
    // 契約者の生年を取得
    let subscriberBirthYear = hearing.basicProfile.user.birthYear;
    if (insurance.subscriber === hearing.basicProfile.partner?.name) {
      subscriberBirthYear = hearing.basicProfile.partner.birthYear;
    }

    const valueList = years.map((year) => {
      const subscriberAge = calculateAge(subscriberBirthYear, year);

      // 契約開始前または終了後は0
      if (
        year < insurance.subscriptionYear ||
        subscriberAge > insurance.endAge
      ) {
        return 0;
      }

      // 契約からの経過年数
      const yearsElapsed = year - insurance.subscriptionYear;
      return compoundGrowth(
        insurance.initialYearlyCost,
        insurance.annualFigures,
        yearsElapsed,
      );
    });

    return {
      name: `${insurance.name}（${insurance.subscriber}）`,
      valueList: valueList.map(formatNumber),
    };
  });
}

/**
 * ライフイベント費用を計算
 */
function calculateLifeEventCosts(
  hearing: HearingJson,
  years: number[],
): number[] {
  return years.map((year) => {
    let cost = 0;
    for (const event of hearing.expenses.lifeEventList) {
      if (event.year === year) {
        cost += event.amount;
      }
    }
    return cost;
  });
}

/**
 * 支出を計算
 */
export function calculateExpense(
  params: ExpenseCalculationParams,
): ExpenditureOutput {
  const { hearing, years } = params;
  const baseYear = years[0];
  const inflationRate = hearing.economic_assumption.inflationRate;

  // 基本生活費
  const baseLivingCost = calculateBaseLivingCost(
    hearing.expenses.currentMonthlyLivingCost,
    years,
    inflationRate,
    baseYear,
  );

  // 子供の生活費
  const childLivingCosts = hearing.basicProfile.childList.map((child) => ({
    name: child.name,
    valueList: calculateChildLivingCost(
      child,
      years,
      baseLivingCost,
      hearing.expenses.childLivingCostRatio,
      hearing.expenses.childIndependenceAge,
    ).map(formatNumber),
  }));

  // 住居費
  const housingCosts = calculateHousingCost(
    hearing.expenses.currentHousingCost,
    years,
    inflationRate,
    baseYear,
  );

  // ライフイベント費用
  const lifeEventCosts = calculateLifeEventCosts(hearing, years);

  // 教育費
  const educationalExpenses = hearing.basicProfile.childList.map((child) => ({
    name: child.name,
    valueList: calculateChildEducation(
      child,
      years,
      inflationRate,
      baseYear,
    ).map(formatNumber),
  }));

  // 保険料
  const insurancePremiums = calculateInsurance(hearing, years, baseYear);

  // サマリー計算
  const summary = years.map((_, idx) => {
    let total = baseLivingCost[idx];

    // 子供の生活費を加算
    for (const childCost of childLivingCosts) {
      total += parseFloat(childCost.valueList[idx]) || 0;
    }

    // 住居費を加算
    total += housingCosts[idx];

    // ライフイベント費用を加算
    total += lifeEventCosts[idx];

    // 教育費を加算
    for (const edu of educationalExpenses) {
      total += parseFloat(edu.valueList[idx]) || 0;
    }

    // 保険料を加算
    for (const insurance of insurancePremiums) {
      total += parseFloat(insurance.valueList[idx]) || 0;
    }

    return formatNumber(total);
  });

  return {
    livingExpense: {
      base: baseLivingCost.map(formatNumber),
      additional: childLivingCosts,
    },
    housingCostList: housingCosts.map(formatNumber),
    lifeEventCostList: lifeEventCosts.map(formatNumber),
    educationalExpenses,
    insurancePremium: insurancePremiums,
    summary,
  };
}
