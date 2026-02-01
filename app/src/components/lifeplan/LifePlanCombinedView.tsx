"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { transformToChartData } from "@/libs/lifeplan/transformers";
import type { LifePlanJson } from "@/schema/lifePlanJson/lifePlanJsonSchema";

import { ChartTooltip } from "./ChartTooltip";
import { LifePlanTableRow } from "./LifePlanTableRow";

interface LifePlanCombinedViewProps {
  data: LifePlanJson;
}

const COLORS = {
  income: "#1d3557",
  expenditure: "#e63946",
  netAssets: "#2a9d8f",
};

const LABEL_WIDTH = 140;
const CELL_WIDTH = 80;
const CHART_HEIGHT = 400;

export function LifePlanCombinedView({ data }: LifePlanCombinedViewProps) {
  const chartData = transformToChartData(data);
  const yearCount = data.year.length;
  const contentWidth = yearCount * CELL_WIDTH;
  const totalWidth = LABEL_WIDTH + contentWidth;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <div style={{ minWidth: totalWidth }}>
        {/* グラフ部分 */}
        <div className="border-b">
          <ComposedChart
            width={totalWidth}
            height={CHART_HEIGHT}
            data={chartData}
            margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const yearNum = parseInt(value, 10);
                return yearNum % 5 === 0 ? value : "";
              }}
            />
            <YAxis
              domain={["dataMin", "dataMax"]}
              allowDataOverflow={true}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value.toLocaleString()}万`}
              width={LABEL_WIDTH}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              formatter={(value) => {
                const labels: Record<string, string> = {
                  income: "収入",
                  expenditure: "支出",
                  netAssets: "純資産",
                };
                return labels[value] ?? value;
              }}
            />
            <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="income"
              fill={COLORS.income}
              fillOpacity={0.3}
              stroke={COLORS.income}
              strokeWidth={2}
              name="income"
            />
            <Area
              type="monotone"
              dataKey="expenditure"
              fill={COLORS.expenditure}
              fillOpacity={0.3}
              stroke={COLORS.expenditure}
              strokeWidth={2}
              name="expenditure"
            />
            <Line
              type="monotone"
              dataKey="netAssets"
              stroke={COLORS.netAssets}
              strokeWidth={3}
              dot={false}
              name="netAssets"
            />
          </ComposedChart>
        </div>

        {/* テーブル部分 */}
        <table className="w-full border-collapse">
          <thead className="bg-background sticky top-0 z-20">
            <LifePlanTableRow label="年度" values={data.year} isHeader />
          </thead>
          <tbody>
            {/* 基本情報セクション */}
            <tr>
              <td
                colSpan={data.year.length + 1}
                className="bg-muted/70 border-b px-3 py-2 text-sm font-bold"
              >
                基本情報
              </td>
            </tr>
            <LifePlanTableRow
              label={`${data.user.name}（本人）年齢`}
              values={data.user.age}
              isHeader
            />
            <LifePlanTableRow
              label={`${data.partner.name}（配偶者）年齢`}
              values={data.partner.age}
              isHeader
            />
            {data.children.map((child) => (
              <LifePlanTableRow
                key={child.name}
                label={`${child.name}年齢`}
                values={child.age}
                isHeader
              />
            ))}
            <LifePlanTableRow
              label="ライフイベント"
              values={data.lifeEvent}
              isHeader
            />

            {/* 収入セクション */}
            <tr>
              <td
                colSpan={data.year.length + 1}
                className="bg-muted/70 border-b px-3 py-2 text-sm font-bold"
              >
                収入
              </td>
            </tr>
            <LifePlanTableRow
              label={`${data.user.name}収入`}
              values={data.income.user}
            />
            <LifePlanTableRow
              label={`${data.partner.name}収入`}
              values={data.income.partner}
            />
            <LifePlanTableRow
              label="収入合計"
              values={data.income.summary}
              isSummary
            />

            {/* 支出セクション */}
            <tr>
              <td
                colSpan={data.year.length + 1}
                className="bg-muted/70 border-b px-3 py-2 text-sm font-bold"
              >
                支出
              </td>
            </tr>
            <LifePlanTableRow
              label="生活費（基本）"
              values={data.expenditure.livingExpense.base}
            />
            {data.expenditure.livingExpense.additional.map((item) => (
              <LifePlanTableRow
                key={item.name}
                label={`生活費（${item.name}）`}
                values={item.valueList}
              />
            ))}
            <LifePlanTableRow
              label="住居費"
              values={data.expenditure.housingCostList}
            />
            <LifePlanTableRow
              label="イベント費"
              values={data.expenditure.lifeEventCostList}
            />
            {data.expenditure.educationalExpenses.map((item) => (
              <LifePlanTableRow
                key={item.name}
                label={`教育費（${item.name}）`}
                values={item.valueList}
              />
            ))}
            {data.expenditure.insurancePremium.map((item) => (
              <LifePlanTableRow
                key={item.name}
                label={`保険料（${item.name}）`}
                values={item.valueList}
              />
            ))}
            <LifePlanTableRow
              label="支出合計"
              values={data.expenditure.summary}
              isSummary
            />

            {/* 資産運用セクション */}
            <tr>
              <td
                colSpan={data.year.length + 1}
                className="bg-muted/70 border-b px-3 py-2 text-sm font-bold"
              >
                資産運用
              </td>
            </tr>
            <LifePlanTableRow
              label="投資資産入力"
              values={data.assetManagement.investmentAssets}
            />
            <LifePlanTableRow
              label="貯蓄入力（計画）"
              values={data.assetManagement.savingInput.planed}
            />
            <LifePlanTableRow
              label="貯蓄入力（差分）"
              values={data.assetManagement.savingInput.diff}
            />
            <LifePlanTableRow
              label="資産運用合計"
              values={data.assetManagement.summary}
              isSummary
            />

            {/* 資産セクション */}
            <tr>
              <td
                colSpan={data.year.length + 1}
                className="bg-muted/70 border-b px-3 py-2 text-sm font-bold"
              >
                資産
              </td>
            </tr>
            <LifePlanTableRow
              label="投資資産"
              values={data.assets.investmentAssets}
            />
            <LifePlanTableRow label="貯蓄" values={data.assets.saving} />
            <LifePlanTableRow
              label="資産合計"
              values={data.assets.summary}
              isSummary
            />

            {/* 負債セクション */}
            <tr>
              <td
                colSpan={data.year.length + 1}
                className="bg-muted/70 border-b px-3 py-2 text-sm font-bold"
              >
                負債
              </td>
            </tr>
            {data.debt.itemList.map((item) => (
              <LifePlanTableRow
                key={item.name}
                label={item.name}
                values={item.valueList}
              />
            ))}
            <LifePlanTableRow
              label="負債合計"
              values={data.debt.summary}
              isSummary
            />

            {/* 純資産セクション */}
            <tr>
              <td
                colSpan={data.year.length + 1}
                className="bg-muted/70 border-b px-3 py-2 text-sm font-bold"
              >
                純資産
              </td>
            </tr>
            <LifePlanTableRow
              label="純資産"
              values={data.netAssets}
              isHighlight
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
