import type { LifePlanJson } from "@/schema/lifePlanJson/lifePlanJsonSchema";

type TsvRow = {
  year: string;
  category: string;
  subcategory: string;
  item: string;
  value: string;
};

/**
 * ライフプランJSONをTSV形式に変換する関数
 * 正規化された長形式（normalized long format）で出力し、AIが読みやすい形式にする
 *
 * @param lifePlan - ライフプランJSON
 * @returns TSV形式の文字列
 */
export function convertLifePlanToTsv(lifePlan: LifePlanJson): string {
  const rows: TsvRow[] = [];
  const years = lifePlan.year;

  // ユーザー情報
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "基本情報",
      subcategory: "本人",
      item: lifePlan.user.name,
      value: lifePlan.user.age[i] ?? "",
    });
  });

  // パートナー情報
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "基本情報",
      subcategory: "配偶者",
      item: lifePlan.partner.name,
      value: lifePlan.partner.age[i] ?? "",
    });
  });

  // 子供情報
  lifePlan.children.forEach((child) => {
    years.forEach((year, i) => {
      rows.push({
        year,
        category: "基本情報",
        subcategory: "子供",
        item: child.name,
        value: child.age[i] ?? "",
      });
    });
  });

  // ライフイベント
  years.forEach((year, i) => {
    const event = lifePlan.lifeEvent[i];
    if (event) {
      rows.push({
        year,
        category: "ライフイベント",
        subcategory: "",
        item: "",
        value: event.replace(/\n/g, " / "),
      });
    }
  });

  // 収入 - 本人
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "収入",
      subcategory: "本人",
      item: "",
      value: lifePlan.income.user[i] ?? "",
    });
  });

  // 収入 - パートナー
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "収入",
      subcategory: "配偶者",
      item: "",
      value: lifePlan.income.partner[i] ?? "",
    });
  });

  // 収入 - 合計
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "収入",
      subcategory: "合計",
      item: "",
      value: lifePlan.income.summary[i] ?? "",
    });
  });

  // 支出 - 生活費（基本）
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "支出",
      subcategory: "生活費",
      item: "基本",
      value: lifePlan.expenditure.livingExpense.base[i] ?? "",
    });
  });

  // 支出 - 生活費（追加：子供別）
  lifePlan.expenditure.livingExpense.additional.forEach((item) => {
    years.forEach((year, i) => {
      rows.push({
        year,
        category: "支出",
        subcategory: "生活費",
        item: item.name,
        value: item.valueList[i] ?? "",
      });
    });
  });

  // 支出 - 住居費
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "支出",
      subcategory: "住居費",
      item: "",
      value: lifePlan.expenditure.housingCostList[i] ?? "",
    });
  });

  // 支出 - ライフイベント費用
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "支出",
      subcategory: "ライフイベント費用",
      item: "",
      value: lifePlan.expenditure.lifeEventCostList[i] ?? "",
    });
  });

  // 支出 - 教育費（子供別）
  lifePlan.expenditure.educationalExpenses.forEach((item) => {
    years.forEach((year, i) => {
      rows.push({
        year,
        category: "支出",
        subcategory: "教育費",
        item: item.name,
        value: item.valueList[i] ?? "",
      });
    });
  });

  // 支出 - 保険料
  lifePlan.expenditure.insurancePremium.forEach((item) => {
    years.forEach((year, i) => {
      rows.push({
        year,
        category: "支出",
        subcategory: "保険料",
        item: item.name,
        value: item.valueList[i] ?? "",
      });
    });
  });

  // 支出 - 合計
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "支出",
      subcategory: "合計",
      item: "",
      value: lifePlan.expenditure.summary[i] ?? "",
    });
  });

  // 資産運用 - 投資資産への入金
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "資産運用",
      subcategory: "投資資産入金",
      item: "",
      value: lifePlan.assetManagement.investmentAssets[i] ?? "",
    });
  });

  // 資産運用 - 貯蓄（予定）
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "資産運用",
      subcategory: "貯蓄",
      item: "予定",
      value: lifePlan.assetManagement.savingInput.planed[i] ?? "",
    });
  });

  // 資産運用 - 貯蓄（差分）
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "資産運用",
      subcategory: "貯蓄",
      item: "差分",
      value: lifePlan.assetManagement.savingInput.diff[i] ?? "",
    });
  });

  // 資産運用 - 合計
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "資産運用",
      subcategory: "合計",
      item: "",
      value: lifePlan.assetManagement.summary[i] ?? "",
    });
  });

  // 資産 - 投資資産
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "資産",
      subcategory: "投資資産",
      item: "",
      value: lifePlan.assets.investmentAssets[i] ?? "",
    });
  });

  // 資産 - 貯蓄
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "資産",
      subcategory: "貯蓄",
      item: "",
      value: lifePlan.assets.saving[i] ?? "",
    });
  });

  // 資産 - 合計
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "資産",
      subcategory: "合計",
      item: "",
      value: lifePlan.assets.summary[i] ?? "",
    });
  });

  // 負債（項目別）
  lifePlan.debt.itemList.forEach((item) => {
    years.forEach((year, i) => {
      rows.push({
        year,
        category: "負債",
        subcategory: item.name,
        item: "",
        value: item.valueList[i] ?? "",
      });
    });
  });

  // 負債 - 合計
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "負債",
      subcategory: "合計",
      item: "",
      value: lifePlan.debt.summary[i] ?? "",
    });
  });

  // 純資産
  years.forEach((year, i) => {
    rows.push({
      year,
      category: "純資産",
      subcategory: "",
      item: "",
      value: lifePlan.netAssets[i] ?? "",
    });
  });

  // TSV形式に変換
  const header = ["年度", "カテゴリ", "サブカテゴリ", "項目名", "値"].join(
    "\t",
  );
  const dataRows = rows.map((row) =>
    [row.year, row.category, row.subcategory, row.item, row.value].join("\t"),
  );

  return [header, ...dataRows].join("\n");
}

/**
 * ゼロ以外のデータのみを含むTSVを生成する（軽量版）
 * ゼロや空の値を除外してファイルサイズを削減
 *
 * @param lifePlan - ライフプランJSON
 * @returns TSV形式の文字列（ゼロ以外のデータのみ）
 */
export function convertLifePlanToTsvCompact(lifePlan: LifePlanJson): string {
  const fullTsv = convertLifePlanToTsv(lifePlan);
  const lines = fullTsv.split("\n");
  const header = lines[0];
  const dataLines = lines.slice(1);

  const filteredLines = dataLines.filter((line) => {
    const value = line.split("\t")[4];
    return value !== "" && value !== "0.0" && value !== "0";
  });

  const tsv = [header, ...filteredLines].join("\n");

  console.log(tsv);

  return [header, ...filteredLines].join("\n");
}
