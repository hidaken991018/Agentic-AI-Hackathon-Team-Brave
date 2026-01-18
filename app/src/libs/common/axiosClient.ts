/**
 * axios 共通クライアント
 *
 * タイムアウト設定とレスポンス時間のログ出力を一元管理します。
 *
 * @module axiosClient
 */

import axios from "axios";

/** デフォルトタイムアウト（ミリ秒） */
const DEFAULT_TIMEOUT_MS = 120 * 1000;

/** axios インスタンス */
export const axiosClient = axios.create({
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

// リクエストインターセプター: リクエスト開始時刻を記録
axiosClient.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now() };
  return config;
});

// レスポンスインターセプター: レスポンス時間をログ出力
axiosClient.interceptors.response.use(
  (response) => {
    const duration = Date.now() - (response.config.metadata?.startTime ?? 0);
    console.log(
      `[axios] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`,
    );
    return response;
  },
  (error) => {
    const duration = Date.now() - (error.config?.metadata?.startTime ?? 0);
    console.error(
      `[axios] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${duration}ms - Error:`,
      error.message,
    );
    return Promise.reject(error);
  },
);

// TypeScript 型拡張
declare module "axios" {
  export interface InternalAxiosRequestConfig {
    metadata?: { startTime: number };
  }
}

export default axiosClient;
