import { beforeEach, describe, expect, it, vi } from "vitest";

import { FlexibleQuestion, QuestionsData } from "@/schema/hearingFormSchema";

import {
  generateDefaultValues,
  getDynamicArrayLabel,
  LifePlanFormData,
  transformToApiPayload,
} from "./transformer";

describe("transformToApiPayload - 詳細構造テスト", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-25T00:00:00Z"));
  });

  const mockQuestionsData = [
    {
      stepTitle: "ステップ1",
      questions: [
        {
          id: "q01",
          label: "お名前",
          type: "text",
          mapping: "basicProfile.user.name",
          purpose: "qualitative",
        },
        {
          id: "q02",
          label: "年齢",
          type: "number",
          mapping: "basicProfile.user.birthYear",
        },
        {
          id: "children_group",
          label: "お子様の情報",
          type: "field_array",
          arrayLabelPrefix: "第{n}子",
          mapping: "basicProfile.childList",
          fields: [
            {
              id: "q06",
              label: "お子様のお名前",
              type: "text",
              mapping: "name",
            },
            {
              id: "q07",
              label: "誕生年",
              type: "number",
              mapping: "birthYear",
            },
          ],
        },
      ],
    },
    {
      stepTitle: "スタンス確認",
      questions: [
        {
          id: "q15",
          label: "基本スタンス",
          type: "radio",

          options: [
            { label: "悲観的（安全第一）", value: "conservative" },
            { label: "妥当的", value: "moderate" },
            { label: "楽観的", value: "aggressive" },
          ],
          purpose: "qualitative",
          related: ["#016", "#017", "#020", "#028"],
        },
      ],
    },
  ] as unknown as QuestionsData;

  it("深いネスト(basicProfile.user.name)が正しくマッピングされること", () => {
    const formData = {
      q01: "田中 太郎",
      q02: "1990",
    };

    const { calculatedData } = transformToApiPayload(
      formData,
      mockQuestionsData,
    );

    // 階層が正しく作られているか
    expect(calculatedData.basicProfile?.user?.name).toBe("田中 太郎");
    expect(calculatedData.basicProfile?.user?.birthYear).toBe(1990);
  });

  it("field_array (childList) が親のパス配下に正しいキー名で配列変換されること", () => {
    const formData = {
      children_group: [
        { q06: "太郎", q07: "2015" },
        { q06: "花子", q07: "2018" },
      ],
    } as unknown as LifePlanFormData;

    const { calculatedData, aiContext } = transformToApiPayload(
      formData,
      mockQuestionsData,
    );

    // 配列の場所と構造のチェック
    const childList = calculatedData.basicProfile?.childList;
    expect(childList).toHaveLength(2);
    expect(childList?.[0]).toEqual({ name: "太郎", birthYear: 2015 });
    expect(childList?.[1]).toEqual({ name: "花子", birthYear: 2018 });
  });

  it("ラジオボタンの選択値が aiContext (定性データ) に正しく抽出されること", () => {
    const formData = {
      q15: "conservative",
    };

    const { aiContext } = transformToApiPayload(formData, mockQuestionsData);

    // aiContext の中身を検証
    const result = aiContext.find((item) => item.label === "基本スタンス");

    expect(result).toBeDefined();
    expect(result?.answer).toBe("conservative"); // 選択された value が入っている
    expect(result?.related).toEqual(["#016", "#017", "#020", "#028"]); // 関連IDが保持されている
  });

  it("値が未入力(空文字)の場合、aiContext に追加されないこと", () => {
    const formData = {
      q15: "",
    };

    const { aiContext } = transformToApiPayload(formData, mockQuestionsData);

    const result = aiContext.find((item) => item.label === "基本スタンス");
    expect(result).toBeUndefined(); // 空文字は addQualitative で弾かれる
  });

  it("meta情報が正しく付与されていること", () => {
    const { calculatedData } = transformToApiPayload({}, mockQuestionsData);

    expect(calculatedData.meta).toEqual({
      hearingVersion: 2,
      answeredAt: "2026-01-25T00:00:00.000Z",
      currency: "万円",
    });
  });
});
describe("generateDefaultValues", () => {
  it("すべての質問に対して適切な初期値を生成すること", () => {
    const mockQuestions = [
      {
        questions: [
          { id: "q1", type: "text" },
          { id: "q2", type: "field_array" },
        ],
      },
    ] as unknown as QuestionsData;

    const defaults = generateDefaultValues(mockQuestions);

    expect(defaults).toEqual({
      q1: "",
      q2: [],
    });
  });
});

describe("getDynamicArrayLabel", () => {
  it("arrayLabelPrefix がある場合、正しく置換されること", () => {
    const parent = { arrayLabelPrefix: "第{n}子" } as FlexibleQuestion;
    expect(getDynamicArrayLabel(parent, 0)).toBe("第1子");
    expect(getDynamicArrayLabel(parent, 1)).toBe("第2子");
  });

  it("arrayLabelPrefix がない場合、デフォルト形式を返すこと", () => {
    const parent = {} as FlexibleQuestion;
    expect(getDynamicArrayLabel(parent, 0)).toBe("1件目");
  });
});
