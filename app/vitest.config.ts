import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // describe や it を import なしで使えるようにする
    alias: {
      "@": path.resolve(__dirname, "./src"), // エイリアス設定を合わせる
    },
  },
});
