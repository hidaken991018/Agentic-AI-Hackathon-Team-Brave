import { HearingJsonInput } from "@/schema/hearingJson/hearingJsonSchema";

/**
 * ヒアリングJSONの最小限のスケルトン
 *
 * ダミーデータを含まず、必須フィールドのみを空の値で初期化します。
 * 実際のデータはフォーム入力やAI解釈結果で上書きされます。
 *
 * 使用目的:
 * - スキーマバリデーションを通過するための最小限の構造を提供
 * - 太郎・花子などのダミーデータを本番データに混入させない
 */
export const hearingJsonSkeleton: HearingJsonInput = {
  meta: {
    hearingVersion: 2,
    answeredAt: "",
    currency: "万円",
  },

  basicProfile: {
    user: { name: "", birthYear: 0 },
    partner: { name: "", birthYear: 0 },
    childList: [],
  },

  economic_assumption: {
    inflationRate: 0,
    investmentReturnRate: 0,
  },

  income: {
    user: {
      stableIncomeList: [],
      temporaryIncomeList: [],
    },
    partner: {
      stableIncomeList: [],
      temporaryIncomeList: [],
    },
  },

  expenses: {
    currentMonthlyLivingCost: 0,
    childIndependenceAge: 0,
    childLivingCostRatio: 0,
    currentHousingCost: 0,
    insuranceList: [],
    lifeEventList: [],
  },

  assets: {
    planedInvestments: { monthlyAmount: 0, growthRate: 0, endAge: 0 },
    currentCash: 0,
    planedSaving: { currentMonthlyAmount: 0, growthRate: 0, endAge: 0 },
    current: { investments: 0 },
  },

  liabilities: {
    loanList: [],
  },
};
