"use client";

import { formatTableValue, isNegative } from "@/libs/lifeplan/formatters";
import { cn } from "@/libs/shadcn/utils";

interface CombinedTableRowProps {
  label?: string;
  values?: string[];
  isLabel?: boolean;
  isHeader?: boolean;
  isSummary?: boolean;
  isHighlight?: boolean;
}

const CELL_WIDTH = 80;

export function CombinedTableRow({
  label,
  values,
  isLabel = false,
  isHeader = false,
  isSummary = false,
  isHighlight = false,
}: CombinedTableRowProps) {
  const baseCellClass = "px-3 py-2 text-sm border-r border-b";
  const cellContentClass = "overflow-hidden text-ellipsis whitespace-nowrap";

  // ラベル列用のスタイル
  const labelCellClass = cn(
    baseCellClass,
    "bg-background",
    isSummary && "font-semibold bg-muted",
    isHighlight && "font-bold bg-primary/10",
    isHeader && "font-semibold bg-muted"
  );

  // 値セル用のスタイル
  const valueCellClass = cn(
    baseCellClass,
    "text-right",
    isSummary && "font-semibold bg-muted/50",
    isHighlight && "font-bold bg-primary/5"
  );

  // ラベル列のみの行（左側固定部分）
  if (isLabel && label !== undefined) {
    return (
      <tr>
        <td className={labelCellClass}>
          <div className={cellContentClass} title={label}>
            {label}
          </div>
        </td>
      </tr>
    );
  }

  // 値列のみの行（右側スクロール部分）
  if (!isLabel && values !== undefined) {
    return (
      <tr>
        {values.map((value, index) => {
          const negative = isNegative(value);
          const displayValue = isHeader ? value : formatTableValue(value);
          return (
            <td
              key={index}
              className={cn(valueCellClass, negative && "text-destructive")}
              style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH, maxWidth: CELL_WIDTH }}
            >
              <div className={cellContentClass} title={displayValue}>
                {displayValue}
              </div>
            </td>
          );
        })}
      </tr>
    );
  }

  return null;
}
