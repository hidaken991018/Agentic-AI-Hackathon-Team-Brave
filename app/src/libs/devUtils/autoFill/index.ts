/**
 * 環境別エクスポート
 * 本番環境ではno-op関数を返し、バンドルサイズをゼロにする
 */

// 開発環境でのみ実際の実装をインポート
import { useAutoFill as useAutoFillImpl } from "./useAutoFill";

// 本番環境では完全に無効化
export const useAutoFill =
  process.env.NODE_ENV === "production"
    ? () => ({
        isEnabled: false,
        fillAllSteps: () => {},
        fillCurrentStep: () => {},
        clearForm: () => {},
      })
    : useAutoFillImpl;
