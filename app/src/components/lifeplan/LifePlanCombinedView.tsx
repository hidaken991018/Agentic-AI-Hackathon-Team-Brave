"use client";

import { useMemo } from "react";

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
import { CombinedTableRow } from "./CombinedTableRow";

interface LifePlanCombinedViewProps {
  data: LifePlanJson;
}

const COLORS = {
  income: "#1d3557",
  expenditure: "#e63946",
  netAssets: "#2a9d8f",
};

const LABEL_WIDTH = 200;
const CELL_WIDTH = 80;
const CHART_HEIGHT = 400;

export function LifePlanCombinedView({ data }: LifePlanCombinedViewProps) {
  const chartData = transformToChartData(data);
  const yearCount = data.year.length;
  const contentWidth = yearCount * CELL_WIDTH;

  // Y軸のdomainを計算して両方のグラフで共有
  const yDomain = useMemo(() => {
    const allValues = chartData.flatMap((d) => [
      d.income,
      d.expenditure,
      d.netAssets,
    ]);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData]);

  console.log("Y Domain:", yDomain);

  return (
    <div className="rounded-lg border">
      <div className="flex">
        {/* 左側: 固定のY軸とラベル列 */}
        <div
          className="bg-background z-10 flex-shrink-0 border-r-2"
          style={{ width: LABEL_WIDTH }}
        >
          {/* Y軸グラフ（固定） */}
          <div className="border-b">
            <ComposedChart
              width={LABEL_WIDTH}
              height={CHART_HEIGHT}
              data={chartData}
              margin={{ top: 20, right: 5, left: 5, bottom: 20 }}
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
              {/* Legendのスペースを確保 */}
              <Legend content={() => <div style={{ height: 24 }} />} />
            </ComposedChart>
          </div>

          {/* テーブルのラベル列（固定） */}
          <div>
            <table className="w-full border-collapse">
              <thead className="bg-background sticky top-0 z-20">
                <CombinedTableRow label="年度" isLabel isHeader />
              </thead>
              <tbody>
                {/* 基本情報セクション */}
                <tr>
                  <td className="bg-muted/70 border-b px-3 py-2 text-sm font-bold">
                    基本情報
                  </td>
                </tr>
                <CombinedTableRow
                  label={`${data.user.name}（本人）年齢`}
                  isLabel
                  isHeader
                />
                <CombinedTableRow
                  label={`${data.partner.name}（配偶者）年齢`}
                  isLabel
                  isHeader
                />
                {data.children.map((child) => (
                  <CombinedTableRow
                    key={child.name}
                    label={`${child.name}年齢`}
                    isLabel
                    isHeader
                  />
                ))}
                <CombinedTableRow label="ライフイベント" isLabel isHeader />

                {/* 収入セクション */}
                <tr>
                  <td className="bg-muted/70 border-b px-3 py-2 text-sm font-bold">
                    収入
                  </td>
                </tr>
                <CombinedTableRow label={`${data.user.name}収入`} isLabel />
                <CombinedTableRow label={`${data.partner.name}収入`} isLabel />
                <CombinedTableRow label="収入合計" isLabel isSummary />

                {/* 支出セクション */}
                <tr>
                  <td className="bg-muted/70 border-b px-3 py-2 text-sm font-bold">
                    支出
                  </td>
                </tr>
                <CombinedTableRow label="生活費（基本）" isLabel />
                {data.expenditure.livingExpense.additional.map((item) => (
                  <CombinedTableRow
                    key={item.name}
                    label={`生活費（${item.name}）`}
                    isLabel
                  />
                ))}
                <CombinedTableRow label="住居費" isLabel />
                <CombinedTableRow label="イベント費" isLabel />
                {data.expenditure.educationalExpenses.map((item) => (
                  <CombinedTableRow
                    key={item.name}
                    label={`教育費（${item.name}）`}
                    isLabel
                  />
                ))}
                {data.expenditure.insurancePremium.map((item) => (
                  <CombinedTableRow
                    key={item.name}
                    label={`保険料（${item.name}）`}
                    isLabel
                  />
                ))}
                <CombinedTableRow label="支出合計" isLabel isSummary />

                {/* 資産運用セクション */}
                <tr>
                  <td className="bg-muted/70 border-b px-3 py-2 text-sm font-bold">
                    資産運用
                  </td>
                </tr>
                <CombinedTableRow label="投資資産入力" isLabel />
                <CombinedTableRow label="貯蓄入力（計画）" isLabel />
                <CombinedTableRow label="貯蓄入力（差分）" isLabel />
                <CombinedTableRow label="資産運用合計" isLabel isSummary />

                {/* 資産セクション */}
                <tr>
                  <td className="bg-muted/70 border-b px-3 py-2 text-sm font-bold">
                    資産
                  </td>
                </tr>
                <CombinedTableRow label="投資資産" isLabel />
                <CombinedTableRow label="貯蓄" isLabel />
                <CombinedTableRow label="資産合計" isLabel isSummary />

                {/* 負債セクション */}
                <tr>
                  <td className="bg-muted/70 border-b px-3 py-2 text-sm font-bold">
                    負債
                  </td>
                </tr>
                {data.debt.itemList.map((item) => (
                  <CombinedTableRow key={item.name} label={item.name} isLabel />
                ))}
                <CombinedTableRow label="負債合計" isLabel isSummary />

                {/* 純資産セクション */}
                <tr>
                  <td className="bg-muted/70 border-b px-3 py-2 text-sm font-bold">
                    純資産
                  </td>
                </tr>
                <CombinedTableRow label="純資産" isLabel isHighlight />
              </tbody>
            </table>
          </div>
        </div>

        {/* 右側: スクロール可能なデータ部分 */}
        <div className="overflow-x-auto">
          <div style={{ width: contentWidth }}>
            {/* メイングラフ（Y軸なし） */}
            <div className="border-b">
              <ComposedChart
                width={contentWidth}
                height={CHART_HEIGHT}
                data={chartData}
                margin={{ top: 20, right: 0, left: 0, bottom: 20 }}
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
                {/* <YAxis domain={yDomain} hide /> */}

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

            {/* テーブルのデータ部分 */}
            <table className="w-full border-collapse">
              <thead className="bg-background sticky top-0 z-20">
                <CombinedTableRow values={data.year} isHeader />
              </thead>
              <tbody>
                {/* 基本情報セクション */}
                <tr>
                  <td
                    colSpan={yearCount}
                    className="bg-muted/70 border-b px-3 py-2 text-sm font-bold"
                  >
                    &nbsp;
                  </td>
                </tr>
                <CombinedTableRow values={data.user.age} isHeader />
                <CombinedTableRow values={data.partner.age} isHeader />
                {data.children.map((child) => (
                  <CombinedTableRow
                    key={child.name}
                    values={child.age}
                    isHeader
                  />
                ))}
                <CombinedTableRow values={data.lifeEvent} isHeader />

                {/* 収入セクション */}
                <tr>
                  <td
                    colSpan={yearCount}
                    className="bg-muted/70 border-b px-3 py-2 text-sm font-bold"
                  >
                    &nbsp;
                  </td>
                </tr>
                <CombinedTableRow values={data.income.user} />
                <CombinedTableRow values={data.income.partner} />
                <CombinedTableRow values={data.income.summary} isSummary />

                {/* 支出セクション */}
                <tr>
                  <td
                    colSpan={yearCount}
                    className="bg-muted/70 border-b px-3 py-2 text-sm font-bold"
                  >
                    &nbsp;
                  </td>
                </tr>
                <CombinedTableRow
                  values={data.expenditure.livingExpense.base}
                />
                {data.expenditure.livingExpense.additional.map((item) => (
                  <CombinedTableRow key={item.name} values={item.valueList} />
                ))}
                <CombinedTableRow values={data.expenditure.housingCostList} />
                <CombinedTableRow values={data.expenditure.lifeEventCostList} />
                {data.expenditure.educationalExpenses.map((item) => (
                  <CombinedTableRow key={item.name} values={item.valueList} />
                ))}
                {data.expenditure.insurancePremium.map((item) => (
                  <CombinedTableRow key={item.name} values={item.valueList} />
                ))}
                <CombinedTableRow values={data.expenditure.summary} isSummary />

                {/* 資産運用セクション */}
                <tr>
                  <td
                    colSpan={yearCount}
                    className="bg-muted/70 border-b px-3 py-2 text-sm font-bold"
                  >
                    &nbsp;
                  </td>
                </tr>
                <CombinedTableRow
                  values={data.assetManagement.investmentAssets}
                />
                <CombinedTableRow
                  values={data.assetManagement.savingInput.planed}
                />
                <CombinedTableRow
                  values={data.assetManagement.savingInput.diff}
                />
                <CombinedTableRow
                  values={data.assetManagement.summary}
                  isSummary
                />

                {/* 資産セクション */}
                <tr>
                  <td
                    colSpan={yearCount}
                    className="bg-muted/70 border-b px-3 py-2 text-sm font-bold"
                  >
                    &nbsp;
                  </td>
                </tr>
                <CombinedTableRow values={data.assets.investmentAssets} />
                <CombinedTableRow values={data.assets.saving} />
                <CombinedTableRow values={data.assets.summary} isSummary />

                {/* 負債セクション */}
                <tr>
                  <td
                    colSpan={yearCount}
                    className="bg-muted/70 border-b px-3 py-2 text-sm font-bold"
                  >
                    &nbsp;
                  </td>
                </tr>
                {data.debt.itemList.map((item) => (
                  <CombinedTableRow key={item.name} values={item.valueList} />
                ))}
                <CombinedTableRow values={data.debt.summary} isSummary />

                {/* 純資産セクション */}
                <tr>
                  <td
                    colSpan={yearCount}
                    className="bg-muted/70 border-b px-3 py-2 text-sm font-bold"
                  >
                    &nbsp;
                  </td>
                </tr>
                <CombinedTableRow values={data.netAssets} isHighlight />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
