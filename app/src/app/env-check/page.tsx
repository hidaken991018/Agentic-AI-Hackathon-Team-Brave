"use client";

import { useState } from "react";

type EnvCheckResult = {
  isGCP: boolean;
  environment: string;
  source: string;
  timestamp: string;
  ENV_VAR_TEST: {
    value: string | undefined;
    status: string;
  };
};

export default function EnvCheckPage() {
  const [result, setResult] = useState<EnvCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkEnv = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/env-check");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">
          環境変数取得テスト
        </h1>

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <p className="mb-4 text-gray-600">
            このページでは、テスト用環境変数（ENV_VAR_TEST）がローカル（.env.local）またはGCP（Secret
            Manager）から正しく取得できているかを確認できます。
          </p>

          <button
            onClick={checkEnv}
            disabled={loading}
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "取得中..." : "環境変数を取得"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            <strong>エラー:</strong> {error}
          </div>
        )}

        {result && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">結果</h2>

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-600">実行環境:</span>
                <span
                  className={`ml-2 rounded px-2 py-1 text-sm ${
                    result.isGCP
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {result.environment}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">取得元:</span>
                <span className="ml-2 text-gray-800">{result.source}</span>
              </div>
            </div>

            <div className="mb-4">
              <span className="font-medium text-gray-600">取得日時:</span>
              <span className="ml-2 text-gray-800">{result.timestamp}</span>
            </div>

            <div className="rounded border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-medium">
                    ENV_VAR_TEST
                  </span>
                  <p className="mt-1 text-sm text-gray-600">
                    値: {result.ENV_VAR_TEST.value || "(未設定)"}
                  </p>
                </div>
                <span
                  className={`rounded px-3 py-1 text-sm ${
                    result.ENV_VAR_TEST.status === "OK"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {result.ENV_VAR_TEST.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
