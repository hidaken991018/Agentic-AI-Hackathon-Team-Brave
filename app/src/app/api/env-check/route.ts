import { NextResponse } from "next/server";

import { getEnv } from "@/libs/env";
import { getEnvInfo } from "@/libs/env/getEnv";

/**
 * 環境変数取得の動作確認用APIエンドポイント
 *
 * GET /api/env-check
 *
 * ローカル環境: .env.local から取得
 * GCP環境: Secret Manager から取得
 *
 * セキュリティのため、テスト用環境変数 ENV_VAR_TEST のみ取得可能
 */
export async function GET() {
  const envInfo = getEnvInfo();
  const testValue = await getEnv("ENV_VAR_TEST");

  return NextResponse.json({
    ...envInfo,
    timestamp: new Date().toISOString(),
    ENV_VAR_TEST: {
      value: testValue,
      status: testValue ? "OK" : "未設定",
    },
  });
}
