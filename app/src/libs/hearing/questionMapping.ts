/**
 * Question ID to Hearing JSON Path Mapping
 *
 * 質問IDとhearingJsonSchemaのパスをマッピング
 */

export type QuestionMapping = {
  /** Hearing JSONパス (例: "economic_assumption.inflationRate") */
  path: string;
  /** データ型 */
  type: "string" | "number" | "boolean";
  /** 説明（デバッグ用） */
  description?: string;
};

/**
 * 質問ID → Hearing JSONパス マッピング
 *
 * CONSTS.QUESTIONSのmappingフィールドから手動で作成
 */
export const QUESTION_MAPPING: Record<string, QuestionMapping> = {
  // Basic Profile
  q001: { path: "basicProfile.user.name", type: "string" },
  q002: { path: "basicProfile.user.birthYear", type: "number" },
  q003: { path: "basicProfile.partner.name", type: "string" },
  q004: { path: "basicProfile.partner.birthYear", type: "number" },
  q005: { path: "basicProfile.childList", type: "string" },

  // Economic Assumptions - AI推論で設定
  q016: {
    path: "economic_assumption.inflationRate",
    type: "number",
    description: "物価上昇率",
  },
  q017: {
    path: "economic_assumption.investmentReturnRate",
    type: "number",
    description: "投資利回り",
  },

  // Manual Economic Assumptions
  q017_manual: { path: "economic_assumption.inflationRate", type: "number" },
  q018: { path: "economic_assumption.investmentReturnRate", type: "number" },

  // Income - AI推論で設定
  q020: {
    path: "income.user.pensionYears",
    type: "number",
    description: "年金受給年数（AI推論）",
  },
  q028: {
    path: "income.user.estimatedPensionAmount",
    type: "number",
    description: "推定年金額（AI推論）",
  },

  // Expenses
  q041: { path: "expenses.currentMonthlyLivingCost", type: "number" },
  q042: { path: "expenses.childIndependenceAge", type: "number" },
  q043: { path: "expenses.housingType", type: "string" },
  q044: { path: "expenses.currentHousingCost", type: "number" },
  q045: { path: "expenses.currentHousingCost", type: "number" },

  // Assets
  q060: { path: "assets.currentCash", type: "number" },
  q061: { path: "assets.planedSaving.currentMonthlyAmount", type: "number" },
  q062: { path: "assets.planedSaving.endAge", type: "number" },
  q063: { path: "assets.current.investments", type: "number" },
  q064: { path: "assets.planedInvestments.monthlyAmount", type: "number" },
  q065: { path: "assets.planedInvestments.endAge", type: "number" },
};

/**
 * 質問IDの正規化
 *
 * 様々な形式を統一形式に変換:
 * - "#016" -> "q016"
 * - "#16" -> "q016"
 * - "q16" -> "q016"
 * - "q016" -> "q016"
 */
export function normalizeQuestionId(id: string): string {
  // #を削除
  let normalized = id.replace("#", "");

  // qプレフィックスを削除
  if (normalized.startsWith("q")) {
    normalized = normalized.substring(1);
  }

  // 3桁にゼロ埋め
  normalized = normalized.padStart(3, "0");

  // qプレフィックスを追加
  return `q${normalized}`;
}

/**
 * 質問IDからhearingJsonパスを取得
 */
export function getHearingJsonPath(questionId: string): string | undefined {
  const normalized = normalizeQuestionId(questionId);
  return QUESTION_MAPPING[normalized]?.path;
}
