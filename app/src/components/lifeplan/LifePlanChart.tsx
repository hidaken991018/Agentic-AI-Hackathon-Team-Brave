"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

import { transformToChartData } from "@/libs/lifeplan/transformers";
import type { LifePlanJson } from "@/schema/lifePlanJson/lifePlanJsonSchema";

import { ChartTooltip } from "./ChartTooltip";

interface LifePlanChartProps {
  data: LifePlanJson;
}

const COLORS = {
  income: "#1d3557",
  expenditure: "#e63946",
  netAssets: "#2a9d8f",
  assets: "#457b9d",
};

export function LifePlanChart({ data }: LifePlanChartProps) {
  const chartData = transformToChartData(data);

  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
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
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value.toLocaleString()}万`}
            width={80}
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
      </ResponsiveContainer>
    </div>
  );
}
