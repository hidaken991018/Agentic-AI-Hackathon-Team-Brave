import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      colors: {
        // shadcnのデフォルト設定は残しつつ、独自の定義を追加
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // ブランドカラーの定義
        main: {
          DEFAULT: "#1D3557",
          foreground: "#F1FAEE",
        },
        accent: {
          DEFAULT: "#E63946",
          foreground: "#F1FAEE",
        },
        utility: {
          1: "#457B9D",
          2: "#A8DADC",
        },
        subtext: "#696969",

        // shadcnの標準マッピング（globals.cssの変数と紐付け）
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
    },
  },
} satisfies Config;

export default config;
