import { formatNumber, isYearInRange } from "../utils";

import type { DebtOutput, HearingJson, Loan, NamedValueList } from "../types";

interface DebtCalculationParams {
  hearing: HearingJson;
  years: number[];
}

/**
 * ローンの年間返済額を計算
 */
function calculateLoanRepayment(loan: Loan, years: number[]): number[] {
  return years.map((year) => {
    if (isYearInRange(year, loan.repaymentStartYear, loan.endYear)) {
      return loan.monthlyRepaymentAmount * 12;
    }
    return 0;
  });
}

/**
 * ローン残高を計算
 */
function calculateLoanBalance(loan: Loan, years: number[]): number[] {
  const yearlyRepayment = loan.monthlyRepaymentAmount * 12;
  const totalYears = loan.endYear - loan.repaymentStartYear + 1;
  const totalAmount = yearlyRepayment * totalYears;

  return years.map((year) => {
    if (year < loan.repaymentStartYear) {
      // 返済開始前は初期残高を推定
      return totalAmount;
    }
    if (year > loan.endYear) {
      return 0;
    }

    // 残り年数から残高を計算
    const yearsRemaining = loan.endYear - year + 1;
    return yearlyRepayment * yearsRemaining;
  });
}

/**
 * 負債を計算
 */
export function calculateDebt(params: DebtCalculationParams): {
  debt: DebtOutput;
  yearlyRepayment: number[];
} {
  const { hearing, years } = params;

  // 各ローンの残高を計算
  const loanBalances: NamedValueList[] = hearing.liabilities.loanList.map(
    (loan, idx) => {
      const balance = calculateLoanBalance(loan, years);
      return {
        name: `ローン${idx + 1}`,
        valueList: balance.map(formatNumber),
      };
    },
  );

  // 年間返済額の合計
  const yearlyRepayment = years.map((year) => {
    let total = 0;
    for (const loan of hearing.liabilities.loanList) {
      if (isYearInRange(year, loan.repaymentStartYear, loan.endYear)) {
        total += loan.monthlyRepaymentAmount * 12;
      }
    }
    return total;
  });

  // 負債サマリー
  const summary = years.map((_, idx) => {
    let total = 0;
    for (const loanBalance of loanBalances) {
      total += parseFloat(loanBalance.valueList[idx]) || 0;
    }
    return formatNumber(total);
  });

  return {
    debt: {
      itemList: loanBalances,
      summary,
    },
    yearlyRepayment,
  };
}
