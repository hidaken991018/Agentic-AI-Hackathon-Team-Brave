/**
 * 追加質問フィールドコンポーネント
 *
 * 追加質問 API から返された Question 型を受け取り、
 * answerMethod に基づいて適切な入力フィールドを表示します。
 *
 * @module AdditionalQuestionField
 */

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Question } from "@/services/hearing/schema/additionalQuestionsSchema";

interface AdditionalQuestionFieldProps {
  question: Question;
  index: number;
}

/**
 * 追加質問フィールドコンポーネント
 *
 * @param question - 追加質問の定義
 * @param index - 質問のインデックス（表示用）
 */
export function AdditionalQuestionField({
  question,
  index,
}: AdditionalQuestionFieldProps) {
  const form = useFormContext();

  // isRequiredに基づいてバリデーションルールを動的に設定
  const validationRules = question.isRequired
    ? { required: "この質問は必須です" }
    : {}; // 任意の場合はバリデーションなし

  // ラベルテキストの生成（任意の場合は "(任意)" を付加）
  const labelText = `質問 ${index + 1}: ${question.text}${
    question.isRequired ? "" : " (任意)"
  }`;

  /**
   * answerFormat に基づいて適切な入力フィールドを返す
   */
  const renderInputField = () => {
    const { answerFormat, options } = question.answerMethod;

    switch (answerFormat) {
      case "radio":
        // ラジオボタン（単一選択）
        return (
          <FormField
            control={form.control}
            name={question.id}
            rules={validationRules}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{labelText}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value as string}
                  >
                    {options?.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                        <label
                          htmlFor={`${question.id}-${option}`}
                          className="cursor-pointer text-sm font-normal"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "pulldown":
        // プルダウン（単一選択 or 複数選択）
        return (
          <FormField
            control={form.control}
            name={question.id}
            rules={validationRules}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{labelText}</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value as string}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください（任意）" />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "numeric":
        // 数値入力
        return (
          <FormField
            control={form.control}
            name={question.id}
            rules={validationRules}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{labelText}</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-36"
                      placeholder="数値を入力（任意）"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                    {question.suffix && (
                      <span className="text-muted-foreground text-sm font-medium whitespace-nowrap">
                        {question.suffix}
                      </span>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "short_text":
        // 短文入力
        return (
          <FormField
            control={form.control}
            name={question.id}
            rules={validationRules}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{labelText}</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="回答を入力（任意）" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "long_text":
        // 長文入力
        return (
          <FormField
            control={form.control}
            name={question.id}
            rules={validationRules}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{labelText}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="詳しくお答えください（任意）"
                    rows={5}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return (
          <div>
            <p className="text-red-500">
              未対応の回答形式: {answerFormat}
            </p>
          </div>
        );
    }
  };

  return <div className="space-y-4">{renderInputField()}</div>;
}
