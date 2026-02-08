/**
 * 開発用テストデータ（ペルソナ）
 */

import { PersonaData, PersonaType } from "./types";

const PERSONAS: Record<PersonaType, PersonaData> = {
  single: {
    user: {
      name: "田中太郎",
      birthYear: 1990,
    },
    hasChildren: "no",
    economicAssumption: {
      autoCalculate: "no",
      inflationRate: 2.0,
      investmentReturnRate: 3.5,
    },
    pensionAutoEstimate: "yes",
    income: {
      user: {
        stableIncomeList: [
          {
            initialAmount: 350000,
            name: "会社員給与",
            growthRate: 2.0,
            startAge: 25,
            endAge: 65,
          },
        ],
        temporaryIncomeList: [],
      },
    },
    expenses: {
      currentMonthlyLivingCost: 220000,
      childIndependenceAge: 0,
      housingType: "rent",
      currentHousingCost: 80000,
      insuranceList: [],
      lifeEventList: [],
    },
    assets: {
      currentCash: 3000000,
      planedSaving: {
        currentMonthlyAmount: 50000,
        endAge: 60,
      },
      currentInvestments: 500000,
      planedInvestments: {
        monthlyAmount: 30000,
        endAge: 60,
      },
    },
    hasLoan: "no",
    loans: [],
    values: {
      targetAsset: 50000000,
      commentStance: "standard",
      priority: "improve_now",
    },
  },
  complexFamily: {
    user: {
      name: "山田太郎",
      birthYear: 1980,
    },
    partner: {
      name: "山田花子",
      birthYear: 1982,
    },
    children: [
      {
        name: "山田一郎",
        birthYear: 2010,
        preschoolersType: "public",
        primarySchoolType: "public",
        juniorHighSchoolType: "private",
        highSchoolType: "private",
        universityType: "private",
        graduateSchoolType: "none",
      },
      {
        name: "山田二郎",
        birthYear: 2013,
        preschoolersType: "public",
        primarySchoolType: "public",
        juniorHighSchoolType: "public",
        highSchoolType: "private",
        universityType: "private",
        graduateSchoolType: "none",
      },
      {
        name: "山田三郎",
        birthYear: 2016,
        preschoolersType: "private",
        primarySchoolType: "private",
        juniorHighSchoolType: "private",
        highSchoolType: "private",
        universityType: "private",
        graduateSchoolType: "private",
      },
    ],
    hasChildren: "yes",
    economicAssumption: {
      autoCalculate: "yes",
      basicStance: "moderate",
    },
    pensionAutoEstimate: "yes",
    income: {
      user: {
        stableIncomeList: [
          {
            initialAmount: 600000,
            name: "会社員給与",
            growthRate: 2.5,
            startAge: 30,
            endAge: 65,
          },
        ],
        temporaryIncomeList: [
          {
            name: "退職金",
            occurYear: 2045,
            amount: 15000000,
          },
        ],
      },
      partner: {
        stableIncomeList: [
          {
            initialAmount: 250000,
            name: "パート収入",
            isSalary: "yes",
            growthRate: 1.0,
            startAge: 35,
            endAge: 60,
          },
        ],
        temporaryIncomeList: [
          {
            name: "退職金",
            occurYear: 2042,
            amount: 3000000,
          },
        ],
      },
    },
    expenses: {
      currentMonthlyLivingCost: 450000,
      childIndependenceAge: 22,
      housingType: "own",
      currentHousingCost: 150000,
      insuranceList: [
        {
          name: "生命保険（本人）",
          type: "掛け捨て型",
          subscriber: "self",
          subscriptionYear: 2005,
          initialYearlyCost: 60000,
          endAge: 65,
        },
        {
          name: "医療保険（本人）",
          type: "掛け捨て型",
          subscriber: "self",
          subscriptionYear: 2010,
          initialYearlyCost: 36000,
          endAge: 70,
        },
        {
          name: "医療保険（配偶者）",
          type: "掛け捨て型",
          subscriber: "partner",
          subscriptionYear: 2012,
          initialYearlyCost: 30000,
          endAge: 70,
        },
      ],
      lifeEventList: [
        {
          name: "車購入",
          year: 2027,
          amount: 3000000,
        },
        {
          name: "住宅リフォーム",
          year: 2030,
          amount: 5000000,
        },
        {
          name: "海外旅行",
          year: 2028,
          amount: 800000,
        },
      ],
    },
    assets: {
      currentCash: 15000000,
      planedSaving: {
        currentMonthlyAmount: 100000,
        endAge: 60,
      },
      currentInvestments: 8000000,
      planedInvestments: {
        monthlyAmount: 80000,
        endAge: 60,
      },
    },
    loans: [
      {
        monthlyRepaymentAmount: 120000,
        interestRateType: "fixed",
        repaymentStartYear: 2015,
        endYear: 2045,
      },
    ],
    hasLoan: "yes",
    values: {
      targetAsset: 100000000,
      commentStance: "kind",
      priority: "adjust_goal",
    },
  },
};

/**
 * ペルソナタイプからペルソナデータを取得
 */
export function getPersonaData(personaType?: string): PersonaData {
  const type = (personaType || "single") as PersonaType;
  return PERSONAS[type] || PERSONAS.single;
}

/**
 * ペルソナの選択肢リスト
 */
export const PERSONA_OPTIONS: Array<{ value: PersonaType; label: string }> = [
  { value: "single", label: "シングル（独身）" },
  { value: "complexFamily", label: "複雑な家族構成" },
];
