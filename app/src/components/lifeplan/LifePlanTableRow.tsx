"use client";

import { formatTableValue, isNegative } from "@/libs/lifeplan/formatters";
import { cn } from "@/libs/shadcn/utils";

interface LifePlanTableRowProps {
  label: string;
  values: string[];
  isHeader?: boolean;
  isSummary?: boolean;
  isHighlight?: boolean;
  className?: string;
}

export function LifePlanTableRow({
  label,
  values,
  isHeader = false,
  isSummary = false,
  isHighlight = false,
  className,
}: LifePlanTableRowProps) {
  const baseCellClass = "px-3 py-2 text-sm border-r border-b";
  const labelCellClass = cn(
    baseCellClass,
    "sticky left-0 z-10 bg-background w-[200px] min-w-[200px] max-w-[200px] border-r-2",
    isSummary && "font-semibold bg-muted",
    isHighlight && "font-bold bg-primary/10",
    isHeader && "font-semibold bg-muted",
  );
  const valueCellClass = cn(
    baseCellClass,
    "text-right w-[80px] min-w-[80px] max-w-[80px]",
    isSummary && "font-semibold bg-muted/50",
    isHighlight && "font-bold bg-primary/5",
  );
  const cellContentClass = "overflow-hidden text-ellipsis whitespace-nowrap";

  return (
    <tr className={className}>
      <td className={labelCellClass}>
        <div className={cellContentClass} title={label}>
          {label}
        </div>
      </td>
      {values.map((value, index) => {
        const negative = isNegative(value);
        const displayValue = isHeader ? value : formatTableValue(value);
        return (
          <td
            key={index}
            className={cn(valueCellClass, negative && "text-destructive")}
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
