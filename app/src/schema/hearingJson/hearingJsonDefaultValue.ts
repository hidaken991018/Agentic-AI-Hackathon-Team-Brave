import { HearingJsonInput } from "@/schema/hearingJson/hearingJsonSchema";

export const hearingDefaultValues = {
  meta: {
    hearingVersion: 2,
    answeredAt: "2004-04-01T12:00Z",
    currency: "万円",
  },

  basicProfile: {
    user: { name: "太郎", birthYear: 1997 },
    partner: { name: "花子", birthYear: 1999 },
    childList: [
      {
        name: "小太郎",
        birthYear: 2000,
        preschoolersType: "PVT",
        primarySchoolType: "PUB",
        juniorHighSchoolType: "PUB",
        highSchoolType: "PUB",
        universityType: "PVT",
        graduateSchoolType: "NON",
      },
    ],
  },

  economic_assumption: {
    inflationRate: 0.01,
    investmentReturnRate: 0.04,
  },

  income: {
    user: {
      stableIncomeList: [
        {
          name: "給与",
          initialAmount: 400,
          growthRate: 0.02,
          startAge: 25,
          endAge: 70,
        },
      ],
      temporaryIncomeList: [{ name: "一時収入", occurYear: 2028, amount: 200 }],
    },
    partner: {
      stableIncomeList: [
        {
          name: "給与",
          initialAmount: 250,
          growthRate: 0.015,
          startAge: 22,
          endAge: 65,
        },
      ],
      temporaryIncomeList: [],
    },
  },

  expenses: {
    currentMonthlyLivingCost: 30,
    childIndependenceAge: 25,
    childLivingCostRatio: 0.3,
    currentHousingCost: 0,
    insuranceList: [
      {
        name: "生命保険",
        subscriber: "太郎",
        subscriptionYear: 2030,
        initialYearlyCost: 5.2,
        endAge: 70,
        annualFigures: 0.01,
      },
    ],
    lifeEventList: [{ name: "結婚式", year: 2027, amount: 300 }],
  },

  assets: {
    planedInvestments: { monthlyAmount: 10, growthRate: 0.01, endAge: 65 },
    currentCash: 100,
    planedSaving: { currentMonthlyAmount: 5, growthRate: 0.01, endAge: 65 },
    current: { investments: 150 },
  },

  liabilities: {
    loanList: [
      { monthlyRepaymentAmount: 11, repaymentStartYear: 2023, endYear: 2058 },
    ],
  },
} as const satisfies HearingJsonInput;
