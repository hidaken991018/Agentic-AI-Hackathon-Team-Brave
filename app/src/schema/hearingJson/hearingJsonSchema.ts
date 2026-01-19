import { z } from "zod";

import { hearingDefaultValues } from "@/schema/hearingJson/hearingJsonDefaultValue";

const tuitionTypeSchema = z
  .union([z.literal("NON"), z.literal("PUB"), z.literal("PVT")])
  .describe("NON:利用なし, PUB:公立, PVT:私立");

export const hearingBaseSchema = z.object({
  meta: z.object({
    hearingVersion: z.number().describe("メタ情報 > ヒアリング仕様バージョン"),
    answeredAt: z.string().describe("メタ情報 > 回答日時（ISO8601 / UTC推奨）"),
    currency: z.string().describe("メタ情報 > 通貨単位"),
  }),
  basicProfile: z.object({
    user: z.object({
      name: z.string().describe("基本プロフィール > 本人名前"),
      birthYear: z.number().describe("基本プロフィール > 本人生年"),
    }),
    partner: z.object({
      name: z.string().describe("基本プロフィール > 世帯 > 配偶者 > 名前"),
      birthYear: z.number().describe("基本プロフィール > 世帯 > 配偶者 > 生年"),
    }),
    childList: z
      .array(
        z.object({
          name: z.string().describe("基本プロフィール > 世帯 > 子ども > 名前"),
          birthYear: z
            .number()
            .describe("基本プロフィール > 世帯 > 子ども > 生年"),
          preschoolersType: tuitionTypeSchema.describe(
            "基本プロフィール > 世帯 > 子ども > 未就学児種別",
          ),
          primarySchoolType: tuitionTypeSchema.describe(
            "基本プロフィール > 世帯 > 子ども > 小学校種別",
          ),
          juniorHighSchoolType: tuitionTypeSchema.describe(
            "基本プロフィール > 世帯 > 子ども > 中学校種別",
          ),
          highSchoolType: tuitionTypeSchema.describe(
            "基本プロフィール > 世帯 > 子ども > 高校種別",
          ),
          universityType: tuitionTypeSchema.describe(
            "基本プロフィール > 世帯 > 子ども > 大学種別",
          ),
          graduateSchoolType: tuitionTypeSchema.describe(
            "基本プロフィール > 世帯 > 子ども > 大学院種別",
          ),
        }),
      )
      .describe("基本プロフィール > 世帯 > 子ども一覧"),
  }),

  economic_assumption: z.object({
    inflationRate: z.number().describe("経済前提 > インフレ率"),
    investmentReturnRate: z.number().describe("経済前提 > 投資利回り"),
  }),
  income: z.object({
    user: z.object({
      stableIncomeList: z
        .array(
          z.object({
            name: z.string().describe("収入 > 継続収入名（本人）"),
            initialAmount: z.number().describe("収入 > 継続収入初期値（本人）"),
            growthRate: z.number().describe("収入 > 継続収入成長率（本人）"),
            startAge: z.number().describe("収入 > 継続収入開始年齢（本人）"),
            endAge: z.number().describe("収入 > 継続収入終了年齢（本人）"),
          }),
        )
        .describe("収入 > 本人 > 継続収入一覧"),
      temporaryIncomeList: z
        .array(
          z.object({
            name: z.string().describe("収入 > 一時収入（本人） > 一時収入名"),
            occurYear: z.number().describe("収入 > 一時収入（本人） > 発生年"),
            amount: z.number().describe("収入 > 一時収入（本人） > 金額"),
          }),
        )
        .describe("収入 > 本人 > 一時収入一覧"),
    }),
    partner: z.object({
      stableIncomeList: z
        .array(
          z.object({
            name: z.string().describe("収入 > 継続収入名（配偶者）"),
            initialAmount: z
              .number()
              .describe("収入 > 継続収入初期値（配偶者）"),
            growthRate: z.number().describe("収入 > 継続収入成長率（配偶者）"),
            startAge: z.number().describe("収入 > 継続収入開始年齢（配偶者）"),
            endAge: z.number().describe("収入 > 継続収入終了年齢（配偶者）"),
          }),
        )
        .describe("収入 > 配偶者 > 継続収入一覧"),
      temporaryIncomeList: z
        .array(
          z.object({
            name: z.string().describe("収入 > 一時収入（配偶者） > 一時収入名"),
            occurYear: z
              .number()
              .describe("収入 > 一時収入（配偶者） > 発生年"),
            amount: z.number().describe("収入 > 一時収入（配偶者） > 金額"),
          }),
        )
        .describe("収入 > 配偶者 > 一時収入一覧"),
    }),
  }),

  expenses: z.object({
    currentMonthlyLivingCost: z.number().describe("支出 > 月間生活費（賃貸）"),
    childIndependenceAge: z.number().describe("支出 > 子ども独立年齢"),
    childLivingCostRatio: z
      .number()
      .describe(
        "支出 > 子ども生活費倍率 ※両親のみの生活費に対する子ども一人の生活費増加倍率",
      ),
    currentHousingCost: z.number().describe("支出 > 住宅費 > 現在"),
    insuranceList: z
      .array(
        z.object({
          name: z.string().describe("支出 > 保険 > 種類名"),
          subscriber: z.string().describe("支出 > 保険 > 加入者"),
          subscriptionYear: z.number().describe("支出 > 保険 > 対象年"),
          initialYearlyCost: z
            .number()
            .describe("支出 > 保険 > 初期費用（年額）"),
          endAge: z.number().describe("支出 > 保険 > 加入終了年齢"),
          annualFigures: z.number().describe("支出 > 保険 > 経年係数"),
        }),
      )
      .describe("支出 > 保険一覧"),
    lifeEventList: z
      .array(
        z.object({
          name: z.string().describe("支出 > ライフイベント > ライフイベント名"),
          year: z.number().describe("支出 > ライフイベント > 発生年"),
          amount: z.number().describe("支出 > ライフイベント > 支出額"),
        }),
      )
      .describe("支出 > ライフイベント一覧"),
  }),
  assets: z.object({
    planedInvestments: z.object({
      monthlyAmount: z
        .number()
        .describe("資産 > 計画資産投入額 > 月あたり投入額"),
      growthRate: z.number().describe("資産 > 計画資産投入額 > 投入額の増加率"),
      endAge: z.number().describe("資産 > 計画貯蓄 > 貯蓄終了年齢"),
    }),
    currentCash: z.number().describe("資産 > 初期現金"),
    planedSaving: z.object({
      currentMonthlyAmount: z
        .number()
        .describe("資産 > 計画貯蓄 > 月あたり貯蓄額"),
      growthRate: z.number().describe("資産 > 計画貯蓄 > 貯蓄の増加率"),
      endAge: z.number().describe("資産 > 計画貯蓄 > 貯蓄の増加率"),
    }),
    current: z.object({
      investments: z.number().describe("資産 > 初期投資資産"),
    }),
  }),
  liabilities: z.object({
    loanList: z
      .array(
        z.object({
          monthlyRepaymentAmount: z
            .number()
            .describe("負債 > ローン > 月額返済額"),
          repaymentStartYear: z.number().describe("負債 > ローン > 返済開始年"),
          endYear: z.number().describe("負債 > ローン > 完済予定年"),
        }),
      )
      .describe("負債 > ローン一覧"),
  }),
});

export type HearingJsonInput = z.input<typeof hearingBaseSchema>;
export type HearingJson = z.output<typeof hearingBaseSchema>;

export const hearingJsonSchema =
  hearingBaseSchema.default(hearingDefaultValues);

export const hearingJsonSchemaForLlm = z.toJSONSchema(hearingJsonSchema);
