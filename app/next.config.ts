import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",

  // Turbopack用の空設定を追加してwebpack警告を回避
  turbopack: {},

  webpack: (config, { dev }) => {
    // 本番ビルド時にdevUtilsを完全に除外
    if (!dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@/libs/devUtils": false,
        "@/components/devTools": false,
      };
    }
    return config;
  },
};

export default nextConfig;
