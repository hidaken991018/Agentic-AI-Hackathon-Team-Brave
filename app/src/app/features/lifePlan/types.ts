// ============================================
// HearingJson 型定義（インプット）
// ============================================

export type SchoolType = "PUB" | "PVT" | "NON";

export interface HearingMeta {
  hearingVersion: number;
  answeredAt: string;
  currency: string;
}

export interface Person {
  name: string;
  birthYear: number;
}

export interface Child extends Person {
  preschoolersType: SchoolType;
  primarySchoolType: SchoolType;
  juniorHighSchoolType: SchoolType;
  highSchoolType: SchoolType;
  universityType: SchoolType;
  graduateSchoolType: SchoolType;
}

export interface BasicProfile {
  user: Person;
  partner?: Person;
  childList: Child[];
}

export interface EconomicAssumption {
  inflationRate: number;
  investmentReturnRate: number;
}

export interface StableIncome {
  name: string;
  initialAmount: number;
  growthRate: number;
  startAge: number;
  endAge: number;
}

export interface TemporaryIncome {
  name: string;
  occurYear: number;
  amount: number;
}

export interface PersonIncome {
  stableIncomeList: StableIncome[];
  temporaryIncomeList: TemporaryIncome[];
}

export interface Insurance {
  name: string;
  subscriber: string;
  subscriptionYear: number;
  initialYearlyCost: number;
  endAge: number;
  annualFigures: number;
}

export interface LifeEvent {
  name: string;
  year: number;
  amount: number;
}

export interface Expenses {
  currentMonthlyLivingCost: number;
  childIndependenceAge: number;
  childLivingCostRatio: number;
  currentHousingCost: number;
  insuranceList: Insurance[];
  lifeEventList: LifeEvent[];
}

export interface PlannedInvestment {
  monthlyAmount: number;
  growthRate: number;
  endAge: number;
}

export interface PlannedSaving {
  currentMonthlyAmount: number;
  growthRate: number;
  endAge: number;
}

export interface Assets {
  planedInvestments: PlannedInvestment;
  currentCash: number;
  planedSaving: PlannedSaving;
  current: {
    investments: number;
  };
}

export interface Loan {
  monthlyRepaymentAmount: number;
  repaymentStartYear: number;
  endYear: number;
}

export interface Liabilities {
  loanList: Loan[];
}

export interface HearingJson {
  meta: HearingMeta;
  basicProfile: BasicProfile;
  economic_assumption: EconomicAssumption;
  income: {
    user: PersonIncome;
    partner?: PersonIncome;
  };
  expenses: Expenses;
  assets: Assets;
  liabilities: Liabilities;
}

// ============================================
// LifePlanJson 型定義（アウトプット）
// ============================================

export interface PersonAge {
  name: string;
  age: string[];
}

export interface ChildAge {
  name: string;
  age: string[];
}

export interface IncomeOutput {
  user: string[];
  partner: string[];
  summary: string[];
}

export interface LivingExpenseOutput {
  base: string[];
  additional: {
    name: string;
    valueList: string[];
  }[];
}

export interface NamedValueList {
  name: string;
  valueList: string[];
}

export interface ExpenditureOutput {
  livingExpense: LivingExpenseOutput;
  housingCostList: string[];
  lifeEventCostList: string[];
  educationalExpenses: NamedValueList[];
  insurancePremium: NamedValueList[];
  summary: string[];
}

export interface SavingInput {
  planed: string[];
  diff: string[];
}

export interface AssetManagementOutput {
  investmentAssets: string[];
  savingInput: SavingInput;
  summary: string[];
}

export interface AssetsOutput {
  investmentAssets: string[];
  saving: string[];
  summary: string[];
}

export interface DebtOutput {
  itemList: NamedValueList[];
  summary: string[];
}

export interface LifePlanJson {
  year: string[];
  user: PersonAge;
  partner: PersonAge;
  children: ChildAge[];
  lifeEvent: string[];
  income: IncomeOutput;
  expenditure: ExpenditureOutput;
  assetManagement: AssetManagementOutput;
  assets: AssetsOutput;
  debt: DebtOutput;
  netAssets: string[];
}
