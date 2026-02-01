/**
 * 自動入力コントロールUI（フローティングボタン）
 */

"use client";

import { useState } from "react";

import { PERSONA_OPTIONS } from "@/libs/devUtils/autoFill/testData";
import { PersonaType } from "@/libs/devUtils/autoFill/types";

interface AutoFillControlsProps {
  onFillAll: (persona?: string) => void;
  onFillStep: () => void;
  onClear: () => void;
}

export function AutoFillControls({
  onFillAll,
  onFillStep,
  onClear,
}: AutoFillControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [persona, setPersona] = useState<PersonaType>("single");

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        // 閉じた状態: 🔧ボタンのみ
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 text-2xl shadow-lg transition-all hover:bg-yellow-500 hover:shadow-xl"
          title="開発ツールを開く"
          aria-label="開発ツールを開く"
        >
          🔧
        </button>
      ) : (
        // 開いた状態: メニュー表示
        <div className="flex flex-col gap-2 rounded-lg bg-yellow-50 p-4 shadow-xl ring-2 ring-yellow-400">
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b border-yellow-300 pb-2">
            <h3 className="text-sm font-semibold text-yellow-900">
              🔧 開発ツール
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-yellow-700 hover:text-yellow-900"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>

          {/* ペルソナ選択 */}
          <div className="space-y-1">
            <label
              htmlFor="persona-select"
              className="text-xs font-medium text-yellow-900"
            >
              テストデータ
            </label>
            <select
              id="persona-select"
              value={persona}
              onChange={(e) => setPersona(e.target.value as PersonaType)}
              className="w-full rounded border border-yellow-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            >
              {PERSONA_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* アクションボタン */}
          <div className="space-y-2 border-t border-yellow-300 pt-2">
            <button
              onClick={() => {
                onFillAll(persona);
                setIsOpen(false);
              }}
              className="w-full rounded bg-yellow-400 px-3 py-2 text-sm font-medium text-yellow-900 transition-colors hover:bg-yellow-500"
            >
              全ステップ入力
              <span className="ml-1 text-xs opacity-70">
                (Ctrl+Shift+A)
              </span>
            </button>

            <button
              onClick={() => {
                onFillStep();
                setIsOpen(false);
              }}
              className="w-full rounded bg-yellow-300 px-3 py-2 text-sm font-medium text-yellow-900 transition-colors hover:bg-yellow-400"
            >
              現在ステップ入力
            </button>

            <button
              onClick={() => {
                onClear();
                setIsOpen(false);
              }}
              className="w-full rounded bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
            >
              フォームクリア
              <span className="ml-1 text-xs opacity-70">
                (Ctrl+Shift+C)
              </span>
            </button>
          </div>

          {/* フッター */}
          <div className="border-t border-yellow-300 pt-2 text-xs text-yellow-700">
            開発環境専用機能
          </div>
        </div>
      )}
    </div>
  );
}
