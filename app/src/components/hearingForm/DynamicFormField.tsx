"use client";
import _ from "lodash";
import { Plus, Trash2 } from "lucide-react";
import {
  ControllerRenderProps,
  FieldValues,
  useFieldArray,
  useFormContext,
} from "react-hook-form";

import { DynamicRadioOptions } from "@/components/hearingForm/DynamicRadioOptions";
import { Button } from "@/components/ui/button";
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
import { FlexibleQuestion, QuestionOption } from "@/schema/hearingFormSchema";

import { DynamicOptions } from "./DynamicOptions";

export function DynamicFormField({ question }: { question: FlexibleQuestion }) {
  const { control, watch } = useFormContext();
  // 1. Lodash で condition を取得
  const condition = _.get(question, "condition");

  if (condition) {
    const watchedValue = watch(condition.field);
    if (watchedValue !== condition.value) return null;
  }

  // 2. type をチェック（これは QuestionData の共通プロパティなので直接アクセス可）
  if (question.type === "field_array") {
    return <FieldArraySection question={question} />;
  }

  return (
    <FormField
      control={control}
      name={question.id as string}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <div className="flex items-center gap-2">
            <FormLabel className="text-base font-semibold">
              {question.label}
            </FormLabel>

            {/* 3. required を安全に判定 */}
            {_.get(question, "required") ? (
              <span className="bg-destructive text-destructive-foreground rounded px-1.5 py-0.5 text-[10px] font-bold">
                必須
              </span>
            ) : (
              <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-bold">
                任意
              </span>
            )}
          </div>
          <FormControl>{renderInput(question, field)}</FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
// 型に応じたUIパーツの切り替え
function renderInput(
  q: FlexibleQuestion,
  field: ControllerRenderProps<FieldValues, string>,
) {
  switch (q.type) {
    case "select":
      return (
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="選択してください" />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(q.options) ? (
              q.options.map((opt: QuestionOption) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))
            ) : (
              <>{q.options && <DynamicOptions type={q.options} />}</>
            )}
          </SelectContent>
        </Select>
      );
    case "radio":
      return (
        <RadioGroup
          onValueChange={field.onChange}
          defaultValue={field.value}
          className="flex gap-4"
        >
          {Array.isArray(q.options) ? (
            q.options.map((opt: QuestionOption) => (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`${q.id}-${opt.value}`} />
                <label htmlFor={`${q.id}-${opt.value}`}>{opt.label}</label>
              </div>
            ))
          ) : (
            <DynamicRadioOptions type={q.options} field={field} />
          )}
        </RadioGroup>
      );
    case "number":
      return <Input type="number" {...field} />;
    default:
      return <Input {...field} />;
  }
}

function FieldArraySection({ question }: { question: FlexibleQuestion }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: question.id,
  });

  return (
    <div className="bg-muted/20 space-y-6 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{question.label}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({})}
        >
          <Plus className="mr-1 h-4 w-4" /> 追加
        </Button>
      </div>

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="bg-background relative space-y-4 rounded border p-4"
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive absolute top-2 right-2"
            onClick={() => remove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <p className="text-primary text-sm font-medium">{index + 1} </p>
          {question?.fields?.map((subQ: FlexibleQuestion) => (
            <DynamicFormField
              key={subQ.id}
              question={{ ...subQ, id: `${question.id}.${index}.${subQ.id}` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
