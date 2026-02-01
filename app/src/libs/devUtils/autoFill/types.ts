/**
 * 開発用自動入力機能の型定義
 */

export interface PersonaData {
  user: {
    name: string;
    birthYear: number;
  };
  partner?: {
    name: string;
    birthYear: number;
  };
  children?: Array<{
    name: string;
    birthYear: number;
    preschoolersType?: string;
    primarySchoolType?: string;
    juniorHighSchoolType?: string;
    highSchoolType?: string;
    universityType?: string;
    graduateSchoolType?: string;
  }>;
  hasChildren: "yes" | "no";
  economicAssumption?: {
    autoCalculate: "yes" | "no";
    basicStance?: string;
    inflationRate?: number;
    investmentReturnRate?: number;
  };
  pensionAutoEstimate?: "yes" | "no";
  income?: {
    user?: {
      stableIncomeList?: Array<{
        initialAmount: number;
        name: string;
        growthRate?: number;
        startAge?: number;
        endAge?: number;
      }>;
      temporaryIncomeList?: Array<{
        name: string;
        occurYear: number;
        amount: number;
      }>;
    };
    partner?: {
      stableIncomeList?: Array<{
        initialAmount: number;
        name: string;
        isSalary?: "yes" | "no";
        growthRate?: number;
        startAge?: number;
        endAge?: number;
      }>;
      temporaryIncomeList?: Array<{
        name: string;
        occurYear: number;
        amount: number;
      }>;
    };
  };
  expenses?: {
    currentMonthlyLivingCost: number;
    childIndependenceAge: number;
    housingType: "rent" | "own";
    currentHousingCost?: number;
    insuranceList?: Array<{
      name: string;
      type: string;
      subscriber: "self" | "partner" | "child";
      subscriptionYear: number;
      initialYearlyCost: number;
      endAge: number;
    }>;
    lifeEventList?: Array<{
      name: string;
      year: number;
      amount: number;
    }>;
  };
  assets?: {
    currentCash: number;
    planedSaving?: {
      currentMonthlyAmount?: number;
      endAge?: number;
    };
    currentInvestments?: number;
    planedInvestments?: {
      monthlyAmount?: number;
      endAge?: number;
    };
  };
  loans?: Array<{
    monthlyRepaymentAmount: number;
    interestRateType: "fixed" | "variable";
    repaymentStartYear: number;
    endYear: number;
  }>;
  hasLoan: "yes" | "no";
  values?: {
    targetAsset?: number;
    commentStance?: string;
    priority?: string;
  };
}

export type PersonaType = "single" | "complexFamily";
