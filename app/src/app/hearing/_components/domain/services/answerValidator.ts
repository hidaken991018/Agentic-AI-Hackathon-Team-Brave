/**
 * 全回答が空かどうかを判定する
 *
 * 空の定義: undefined, null, 空文字列, NaN
 * 空オブジェクト `{}` の場合も `true` を返す（`Object.values({}).every(...)` は vacuous truth）
 */
export function isAllAnswersEmpty(answers: Record<string, unknown>): boolean {
  return Object.values(answers).every(
    (v) =>
      v === undefined ||
      v === null ||
      v === "" ||
      (typeof v === "number" && isNaN(v)),
  );
}
