import { SelectItem } from "@/components/ui/select";
import { QuestionOption } from "@/schema/hearingFormSchema";

export function DynamicOptions({
  type,
}: {
  type: string | readonly QuestionOption[];
}) {
  const currentYear = new Date().getFullYear();

  switch (type) {
    // 1. 過去〜現在の年（誕生年など：100年前まで）
    case "year_range":
      return (
        <>
          {Array.from({ length: 100 }, (_, i) => {
            const year = currentYear - i;
            return (
              <SelectItem key={year} value={year.toString()}>
                {year}年
              </SelectItem>
            );
          })}
        </>
      );

    // 2. 現在〜未来の年（ライフイベント、完済予定など：50年先まで）
    case "future_year_range":
      return (
        <>
          {Array.from({ length: 51 }, (_, i) => {
            const year = currentYear + i;
            return (
              <SelectItem key={year} value={year.toString()}>
                {year}年
              </SelectItem>
            );
          })}
        </>
      );

    // 3. 年齢選択（0歳〜100歳）
    case "age_range":
      return (
        <>
          {Array.from({ length: 101 }, (_, i) => (
            <SelectItem key={i} value={i.toString()}>
              {i}歳
            </SelectItem>
          ))}
        </>
      );

    // 4. 期間選択（0年〜40年）
    case "years_0_40":
      return (
        <>
          {Array.from({ length: 41 }, (_, i) => (
            <SelectItem key={i} value={i.toString()}>
              {i}年
            </SelectItem>
          ))}
        </>
      );

    // 6. シンプルな「はい・いいえ」
    case "yes_no":
      return (
        <>
          <SelectItem value="yes">はい</SelectItem>
          <SelectItem value="no">いいえ</SelectItem>
        </>
      );

    default:
      return null;
  }
}
