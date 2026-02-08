import { readFileSync } from "fs";
import { join } from "path";

import { generateLifePlan } from "./calculators";

import type { HearingJson, LifePlanJson } from "./types";

// hearingJsonのパス（プロジェクトルートからの相対パス）
const HEARING_JSON_PATH = join(process.cwd(), "dst", "hearingJson.sample.json");

/**
 * ヒアリングJSONファイルを読み込んでライフプランを生成
 * （現状はファイルから読み込み、将来的には引数として受け取る予定）
 */
export function createLifePlan(): LifePlanJson {
  // dstからhearingJsonを読み取り
  const hearingJsonRaw = readFileSync(HEARING_JSON_PATH, "utf-8");
  const hearingJson = JSON.parse(hearingJsonRaw) as HearingJson;

  // ライフプランを生成
  return generateLifePlan(hearingJson);
}

/**
 * ヒアリングJSONからライフプランを生成
 * （引数としてヒアリングJSONを受け取るバージョン）
 */
export function createLifePlanFromHearing(
  hearingJson: HearingJson,
): LifePlanJson {
  return generateLifePlan(hearingJson);
}

// 型定義のエクスポート
export type { HearingJson, LifePlanJson } from "./types";

// 計算関数のエクスポート（必要に応じて個別に使用可能）
export { generateLifePlan } from "./calculators";
