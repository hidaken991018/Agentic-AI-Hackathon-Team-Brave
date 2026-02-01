"use client";

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const LABEL_MAP: Record<string, string> = {
  income: "収入",
  expenditure: "支出",
  netAssets: "純資産",
  assets: "資産",
};

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <p className="font-semibold mb-2">{label}年</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span>{LABEL_MAP[entry.name] ?? entry.name}:</span>
          <span className="font-medium">
            {entry.value.toLocaleString("ja-JP", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 1,
            })}
            万円
          </span>
        </div>
      ))}
    </div>
  );
}
