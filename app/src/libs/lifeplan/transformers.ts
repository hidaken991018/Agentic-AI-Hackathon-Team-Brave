import type { LifePlanJson } from "@/schema/lifePlanJson/lifePlanJsonSchema";

import { parseValue } from "./formatters";

export interface ChartDataPoint {
  year: string;
  income: number;
  expenditure: number;
  netAssets: number;
  assets: number;
}

/**
 * LifePlanJsonをグラフ用データ配列に変換
 */
export function transformToChartData(data: LifePlanJson): ChartDataPoint[] {
  return data.year.map((year, index) => ({
    year,
    income: parseValue(data.income.summary[index] ?? "0"),
    expenditure: parseValue(data.expenditure.summary[index] ?? "0"),
    netAssets: parseValue(data.netAssets[index] ?? "0"),
    assets: parseValue(data.assets.summary[index] ?? "0"),
  }));
}
