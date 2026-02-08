/**
 * 文字列を数値に変換
 * 空文字列やパースできない値は0を返す
 */
export function parseValue(value: string): number {
  if (!value || value.trim() === "") {
    return 0;
  }
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

/**
 * 数値を表示用フォーマットに変換（万円単位、3桁カンマ区切り）
 * 小数点1桁まで表示
 */
export function formatTableValue(value: string): string {
  const num = parseValue(value);
  if (num === 0) {
    return "-";
  }
  return num.toLocaleString("ja-JP", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

/**
 * 値が負かどうかを判定
 */
export function isNegative(value: string): boolean {
  return parseValue(value) < 0;
}
