import {
  Brain,
  ClipboardList,
  Clock,
  Cloud,
  Coins,
  Compass,
  Cpu,
  FileQuestion,
  LineChart,
  MessageSquare,
  Sparkles,
  Zap,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export type SectionItem = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

export type TechItem = {
  icon: LucideIcon;
  label: string;
  desc: string;
};

export const PAIN_POINTS: SectionItem[] = [
  {
    icon: Coins,
    title: "FP相談は1回数万円",
    desc: "専門家に相談したいけど、費用が気になる...",
  },
  {
    icon: Clock,
    title: "忙しくて時間がない",
    desc: "予約して出向く手間が面倒...",
  },
  {
    icon: FileQuestion,
    title: "何から始めればいいかわからない",
    desc: "漠然とした不安はあるけど、相談内容が整理できない...",
  },
];

export const FEATURES: SectionItem[] = [
  {
    icon: MessageSquare,
    title: "AI対話型ヒアリング",
    desc: "チャット感覚で6つの質問に答えるだけ。AIがあなたの状況を丁寧にヒアリングします",
  },
  {
    icon: Brain,
    title: "マルチAIによる分析",
    desc: "複数のAIエージェントが連携し、FPの知見に基づいた精度の高い分析を実現",
  },
  {
    icon: LineChart,
    title: "ライフプランの可視化",
    desc: "あなたの人生設計をグラフで分かりやすく表示。将来の見通しが一目瞭然",
  },
];

export const STEPS: SectionItem[] = [
  {
    icon: ClipboardList,
    title: "質問に答える",
    desc: "家族構成・収入・支出など6つの項目に回答",
  },
  {
    icon: Sparkles,
    title: "AIが深掘り",
    desc: "回答内容からAIが追加質問を生成し、より正確な情報を収集",
  },
  {
    icon: Compass,
    title: "ライフプランが完成",
    desc: "あなただけのライフプランをグラフと解説で提示",
  },
];

export const TECHS: TechItem[] = [
  {
    icon: Cpu,
    label: "FP Instructor Agent",
    desc: "Vertex AI Agent Engine / Gemini 2.5 Flash",
  },
  {
    icon: Zap,
    label: "JSON Editor Agent",
    desc: "Gemini API による高速JSON生成",
  },
  {
    icon: Cloud,
    label: "Google Cloud",
    desc: "Cloud Run / Firestore / Cloud SQL",
  },
];
