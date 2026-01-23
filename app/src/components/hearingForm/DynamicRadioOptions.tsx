import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function DynamicRadioOptions({
  type,
  field,
}: {
  type: string;
  field: any;
}) {
  // 教育オプションのデータ定義
  const eduOptions = [
    { label: "なし", value: "NON" }, // Zodスキーマに合わせてNONに
    { label: "公立", value: "PUB" }, // Zodスキーマに合わせてPUBに
    { label: "私立", value: "PVT" }, // Zodスキーマに合わせてPVTに
  ];

  const yesNoOptions = [
    { label: "はい", value: "yes" },
    { label: "いいえ", value: "no" },
  ];

  const renderOptions = (options: { label: string; value: string }[]) => (
    <RadioGroup
      onValueChange={field.onChange}
      defaultValue={field.value}
      className="flex flex-col space-y-1"
    >
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <RadioGroupItem
            value={option.value}
            id={`${field.name}-${option.value}`}
          />
          <Label
            htmlFor={`${field.name}-${option.value}`}
            className="cursor-pointer font-normal"
          >
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );

  switch (type) {
    case "edu_options":
      return renderOptions(eduOptions);
    case "yes_no":
      return renderOptions(yesNoOptions);
    default:
      return null;
  }
}
