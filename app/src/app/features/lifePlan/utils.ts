import { DEFAULT_START_YEAR, SIMULATION_END_AGE } from "./constants";

import type { HearingJson } from "./types";

/**
 * 数値を小数点1桁の文字列にフォーマット
 */
export function formatNumber(value: number): string {
  return value.toFixed(1);
}

/**
 * 年から年齢を計算
 */
export function calculateAge(birthYear: number, currentYear: number): number {
  return currentYear - birthYear;
}

/**
 * 年齢を文字列に変換（生まれる前は空文字）
 */
export function ageToString(age: number): string {
  return age >= 0 ? age.toString() : "";
}

/**
 * 累積成長計算: 初期値 × (1 + rate)^年数
 */
export function compoundGrowth(
  initialValue: number,
  rate: number,
  years: number,
): number {
  return initialValue * Math.pow(1 + rate, years);
}

/**
 * シミュレーション期間の年リストを生成
 */
export function generateYearList(hearing: HearingJson): number[] {
  const startYear = DEFAULT_START_YEAR;
  const userBirthYear = hearing.basicProfile.user.birthYear;
  const endYear = userBirthYear + SIMULATION_END_AGE;

  const years: number[] = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }
  return years;
}

/**
 * 年リストにおける各人物の年齢リストを生成
 */
export function generateAgeList(birthYear: number, years: number[]): string[] {
  return years.map((year) => {
    const age = calculateAge(birthYear, year);
    return ageToString(age);
  });
}

/**
 * 特定年齢が範囲内かどうかをチェック
 */
export function isAgeInRange(
  age: number,
  startAge: number,
  endAge: number,
): boolean {
  return age >= startAge && age <= endAge;
}

/**
 * 特定年が範囲内かどうかをチェック
 */
export function isYearInRange(
  year: number,
  startYear: number,
  endYear: number,
): boolean {
  return year >= startYear && year <= endYear;
}

/**
 * 0埋めされた配列を生成
 */
export function createZeroArray(length: number): string[] {
  return Array(length).fill("0.0");
}

/**
 * 配列の合計を計算して文字列配列で返す
 */
export function sumArrays(...arrays: number[][]): string[] {
  if (arrays.length === 0) return [];
  const length = arrays[0].length;

  return Array.from({ length }, (_, i) => {
    const sum = arrays.reduce((acc, arr) => acc + (arr[i] || 0), 0);
    return formatNumber(sum);
  });
}

/**
 * 文字列配列を数値配列に変換
 */
export function toNumberArray(arr: string[]): number[] {
  return arr.map((v) => parseFloat(v) || 0);
}
