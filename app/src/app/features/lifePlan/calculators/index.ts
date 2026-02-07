import {
  LIFE_EVENT_LABELS,
  PENSION_START_AGE,
  SCHOOL_ENTRY_AGES,
} from "../constants";
import {
  formatNumber,
  generateAgeList,
  generateYearList,
  toNumberArray,
} from "../utils";
import { calculateAssetManagement, calculateAssets } from "./asset";
import { calculateDebt } from "./debt";
import { calculateExpense } from "./expense";
import { calculateIncome } from "./income";

import type { ChildAge, HearingJson, LifePlanJson, PersonAge } from "../types";

/**
 * ライフイベントを生成
 */
function generateLifeEvents(hearing: HearingJson, years: number[]): string[] {
  const events: Map<number, string[]> = new Map();

  // 初期化
  for (const year of years) {
    events.set(year, []);
  }

  // ユーザー定義のライフイベント
  for (const event of hearing.expenses.lifeEventList) {
    const yearEvents = events.get(event.year) || [];
    yearEvents.push(event.name);
    events.set(event.year, yearEvents);
  }

  // 子供関連のイベント
  for (const child of hearing.basicProfile.childList) {
    // 出産
    const birthYear = child.birthYear;
    if (events.has(birthYear)) {
      const yearEvents = events.get(birthYear) || [];
      yearEvents.push(LIFE_EVENT_LABELS.birth(child.name));
      events.set(birthYear, yearEvents);
    }

    // 学校入学イベント
    const schoolEvents = [
      {
        age: SCHOOL_ENTRY_AGES.preschool,
        type: child.preschoolersType,
        label: LIFE_EVENT_LABELS.preschoolEntry,
      },
      {
        age: SCHOOL_ENTRY_AGES.primarySchool,
        type: child.primarySchoolType,
        label: LIFE_EVENT_LABELS.primarySchoolEntry,
      },
      {
        age: SCHOOL_ENTRY_AGES.juniorHighSchool,
        type: child.juniorHighSchoolType,
        label: LIFE_EVENT_LABELS.juniorHighSchoolEntry,
      },
      {
        age: SCHOOL_ENTRY_AGES.highSchool,
        type: child.highSchoolType,
        label: LIFE_EVENT_LABELS.highSchoolEntry,
      },
      {
        age: SCHOOL_ENTRY_AGES.university,
        type: child.universityType,
        label: LIFE_EVENT_LABELS.universityEntry,
      },
      {
        age: SCHOOL_ENTRY_AGES.graduateSchool,
        type: child.graduateSchoolType,
        label: LIFE_EVENT_LABELS.graduateSchoolEntry,
      },
    ];

    for (const schoolEvent of schoolEvents) {
      if (schoolEvent.type !== "NON") {
        const eventYear = child.birthYear + schoolEvent.age;
        if (events.has(eventYear)) {
          const yearEvents = events.get(eventYear) || [];
          yearEvents.push(schoolEvent.label(child.name));
          events.set(eventYear, yearEvents);
        }
      }
    }
  }

  // ユーザーの退職イベント
  const userRetirementYear =
    hearing.basicProfile.user.birthYear + PENSION_START_AGE;
  if (events.has(userRetirementYear)) {
    const yearEvents = events.get(userRetirementYear) || [];
    yearEvents.push(
      LIFE_EVENT_LABELS.retirement(hearing.basicProfile.user.name),
    );
    events.set(userRetirementYear, yearEvents);
  }

  // パートナーの退職イベント
  if (hearing.basicProfile.partner) {
    const partnerRetirementYear =
      hearing.basicProfile.partner.birthYear + PENSION_START_AGE;
    if (events.has(partnerRetirementYear)) {
      const yearEvents = events.get(partnerRetirementYear) || [];
      yearEvents.push(
        LIFE_EVENT_LABELS.retirement(hearing.basicProfile.partner.name),
      );
      events.set(partnerRetirementYear, yearEvents);
    }
  }

  // 結果を文字列配列に変換
  return years.map((year) => {
    const yearEvents = events.get(year) || [];
    return yearEvents.join("\n");
  });
}

/**
 * 純資産を計算
 */
function calculateNetAssets(
  assetsSummary: string[],
  debtSummary: string[],
): string[] {
  const assets = toNumberArray(assetsSummary);
  const debts = toNumberArray(debtSummary);

  return assets.map((asset, i) => {
    return formatNumber(asset - debts[i]);
  });
}

/**
 * ライフプランを生成
 */
export function generateLifePlan(hearing: HearingJson): LifePlanJson {
  // 年リストを生成
  const years = generateYearList(hearing);
  const yearStrings = years.map((y) => y.toString());

  // 基本プロファイル
  const user: PersonAge = {
    name: hearing.basicProfile.user.name,
    age: generateAgeList(hearing.basicProfile.user.birthYear, years),
  };

  const partner: PersonAge = {
    name: hearing.basicProfile.partner?.name || "",
    age: hearing.basicProfile.partner
      ? generateAgeList(hearing.basicProfile.partner.birthYear, years)
      : years.map(() => ""),
  };

  const children: ChildAge[] = hearing.basicProfile.childList.map((child) => ({
    name: child.name,
    age: generateAgeList(child.birthYear, years),
  }));

  // ライフイベント
  const lifeEvent = generateLifeEvents(hearing, years);

  // 収入計算
  const income = calculateIncome({ hearing, years });

  // 支出計算
  const expenditure = calculateExpense({ hearing, years });

  // 負債計算
  const { debt, yearlyRepayment } = calculateDebt({ hearing, years });

  // 資産運用計算
  const assetManagement = calculateAssetManagement({
    hearing,
    years,
    income,
    expenditure,
    debtRepayment: yearlyRepayment,
  });

  // 資産残高計算
  const assets = calculateAssets({
    hearing,
    years,
    income,
    expenditure,
    debtRepayment: yearlyRepayment,
  });

  // 純資産計算
  const netAssets = calculateNetAssets(assets.summary, debt.summary);

  return {
    year: yearStrings,
    user,
    partner,
    children,
    lifeEvent,
    income,
    expenditure,
    assetManagement,
    assets,
    debt,
    netAssets,
  };
}
