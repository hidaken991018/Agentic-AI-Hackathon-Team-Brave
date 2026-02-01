"use client";

import type { LifePlanJson } from "@/schema/lifePlanJson/lifePlanJsonSchema";

import { LifePlanTableRow } from "./LifePlanTableRow";

interface LifePlanTableProps {
  data: LifePlanJson;
}

export function LifePlanTable({ data }: LifePlanTableProps) {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="border-collapse">
        <thead className="sticky top-0 z-20 bg-background">
          <LifePlanTableRow
            label="年度"
            values={data.year}
            isHeader
          />
        </thead>
        <tbody>
          {/* 基本情報セクション */}
          <tr>
            <td
              colSpan={data.year.length + 1}
              className="px-3 py-2 text-sm font-bold bg-muted/70 border-b"
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
              className="px-3 py-2 text-sm font-bold bg-muted/70 border-b"
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
              className="px-3 py-2 text-sm font-bold bg-muted/70 border-b"
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
              className="px-3 py-2 text-sm font-bold bg-muted/70 border-b"
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
              className="px-3 py-2 text-sm font-bold bg-muted/70 border-b"
            >
              資産
            </td>
          </tr>
          <LifePlanTableRow
            label="投資資産"
            values={data.assets.investmentAssets}
          />
          <LifePlanTableRow
            label="貯蓄"
            values={data.assets.saving}
          />
          <LifePlanTableRow
            label="資産合計"
            values={data.assets.summary}
            isSummary
          />

          {/* 負債セクション */}
          <tr>
            <td
              colSpan={data.year.length + 1}
              className="px-3 py-2 text-sm font-bold bg-muted/70 border-b"
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
              className="px-3 py-2 text-sm font-bold bg-muted/70 border-b"
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
  );
}
