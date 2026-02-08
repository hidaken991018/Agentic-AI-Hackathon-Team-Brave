import type { SchoolType } from "./types";

// ============================================
// 教育費テーブル（年間、万円）
// ============================================

// 学校種別ごとの年間教育費
export const EDUCATION_COSTS: Record<string, Record<SchoolType, number>> = {
  preschool: { PUB: 0, PVT: 0, NON: 0 }, // 保育園は生活費に含む
  primarySchool: { PUB: 12, PVT: 30, NON: 0 },
  juniorHighSchool: { PUB: 24, PVT: 50, NON: 0 },
  highSchool: { PUB: 36, PVT: 70, NON: 0 },
  university: { PUB: 40, PVT: 60, NON: 0 },
  graduateSchool: { PUB: 50, PVT: 80, NON: 0 },
};

// 学校に通う年齢範囲
export const SCHOOL_AGE_RANGES = {
  preschool: { start: 3, end: 5 }, // 3〜5歳
  primarySchool: { start: 6, end: 11 }, // 6〜11歳（小学校1年〜6年）
  juniorHighSchool: { start: 12, end: 14 }, // 12〜14歳（中学1年〜3年）
  highSchool: { start: 15, end: 17 }, // 15〜17歳（高校1年〜3年）
  university: { start: 18, end: 21 }, // 18〜21歳（大学1年〜4年）
  graduateSchool: { start: 22, end: 23 }, // 22〜23歳（大学院修士2年）
};

// ============================================
// 年金関連定数
// ============================================

// 年金受給開始年齢
export const PENSION_START_AGE = 65;

// 退職時給与に対する年金割合
export const PENSION_RATE = 0.25;

// ============================================
// シミュレーション設定
// ============================================

// シミュレーション終了年齢（ユーザーの年齢）
export const SIMULATION_END_AGE = 100;

// デフォルトの開始年（現在年）
export const DEFAULT_START_YEAR = new Date().getFullYear();

// ============================================
// ライフイベント自動生成用ラベル
// ============================================

export const LIFE_EVENT_LABELS = {
  preschoolEntry: (name: string) => `保育園入園（${name}）`,
  primarySchoolEntry: (name: string) => `小学校入学（${name}）`,
  juniorHighSchoolEntry: (name: string) => `中学校入学（${name}）`,
  highSchoolEntry: (name: string) => `高校入学（${name}）`,
  universityEntry: (name: string) => `大学入学（${name}）`,
  graduateSchoolEntry: (name: string) => `大学院入学（${name}）`,
  birth: (name: string) => `出産（${name}）`,
  retirement: (name: string) => `${name}年金生活開始`,
};

// 学校入学年齢
export const SCHOOL_ENTRY_AGES = {
  preschool: 3,
  primarySchool: 6,
  juniorHighSchool: 12,
  highSchool: 15,
  university: 18,
  graduateSchool: 22,
};
