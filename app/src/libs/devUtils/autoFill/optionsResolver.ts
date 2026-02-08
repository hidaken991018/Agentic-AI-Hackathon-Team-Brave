/**
 * オプション文字列を実際のオプション配列に変換
 */

interface Option {
  label: string;
  value: string;
}

/**
 * オプション文字列を実際のオプション配列に変換
 * questions.ts の options プロパティに対応
 */
export function resolveOptions(options: unknown): Option[] {
  if (Array.isArray(options)) {
    return options as Option[];
  }

  if (typeof options !== "string") {
    return [];
  }

  const currentYear = new Date().getFullYear();

  switch (options) {
    case "year_range":
      // 1950年〜現在までの年
      return Array.from({ length: currentYear - 1949 }, (_, i) => {
        const year = 1950 + i;
        return { label: `${year}年`, value: year.toString() };
      });

    case "future_year_range":
      // 現在〜2100年までの年
      return Array.from({ length: 2100 - currentYear + 1 }, (_, i) => {
        const year = currentYear + i;
        return { label: `${year}年`, value: year.toString() };
      });

    case "age_range":
      // 0歳〜100歳
      return Array.from({ length: 101 }, (_, i) => ({
        label: `${i}歳`,
        value: i.toString(),
      }));

    case "years_0_40":
      // 0年〜40年
      return Array.from({ length: 41 }, (_, i) => ({
        label: `${i}年`,
        value: i.toString(),
      }));

    case "edu_options":
      return [
        { label: "公立", value: "public" },
        { label: "私立", value: "private" },
        { label: "なし", value: "none" },
      ];

    case "yes_no":
      return [
        { label: "はい", value: "yes" },
        { label: "いいえ", value: "no" },
      ];

    default:
      console.warn(`Unknown options type: ${options}`);
      return [];
  }
}
