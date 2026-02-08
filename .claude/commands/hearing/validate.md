---
description: ヒアリング機能の包括的な検証を実行
allowed-tools: Bash, Read, Grep, Glob
argument-hint: [--quick | --full]
---

# ヒアリング機能検証コマンド

<background_information>
- **目的**: ヒアリングページのリファクタリングとJSON構築実装の正確性を検証
- **成功基準**:
  - TypeScriptビルドがエラーなしで成功
  - 主要ファイルが正しく存在し、インポートが解決できる
  - 重要な関数とコンポーネントが適切に実装されている
  - Context統合が正しく設定されている
</background_information>

<instructions>
## 実行内容

### モード選択
- `--quick`: 基本的なビルドとファイル存在チェックのみ（デフォルト）
- `--full`: 完全な検証（ビルド、Lint、詳細なコード検証）

### Step 1: ビルド検証

**TypeScriptビルド**:
```bash
cd app && npm run build
```

**検証ポイント**:
- ビルドエラーがないこと
- 型エラーがないこと
- 全てのページが正常にビルドされること

### Step 2: ファイル存在確認

**新規作成ファイル（6ファイル）**:
- `app/src/context/HearingContext.tsx`
- `app/src/app/hearing/layout.tsx`
- `app/src/libs/hearing/questionMapping.ts`
- `app/src/libs/hearing/hearingJsonBuilder.ts`
- `app/src/app/api/hearing/save-session/route.ts`
- `app/src/app/hearing/additional-questions/page.tsx`

**修正ファイル（1ファイル）**:
- `app/src/app/hearing/page.tsx`

### Step 3: 重要な機能の確認

**HearingContext.tsx**:
- `HearingProvider` コンポーネントが存在
- `useHearing` フックが存在
- 必要な状態管理（sessionId, hearingJson, isSubmitting, error）

**hearingJsonBuilder.ts**:
- `buildHearingJson()` 関数が存在
- `validateHearingJson()` 関数が存在
- `extractEstimations()` 関数が存在

**questionMapping.ts**:
- `QUESTION_MAPPING` 定数が存在
- `normalizeQuestionId()` 関数が存在
- `getHearingJsonPath()` 関数が存在

**hearing/page.tsx**:
- `useHearing()` をインポート
- `buildHearingJson()` を使用
- `validateHearingJson()` を使用
- `/api/hearing/save-session` を呼び出し
- `/hearing/additional-questions` へリダイレクト
- フェーズ管理（HearingPhase）が削除されている

**additional-questions/page.tsx**:
- `useHearing()` をインポート
- `buildHearingJson()` を使用（部分更新）
- `/api/hearing/save-session` を呼び出し

**save-session/route.ts**:
- POST ハンドラーが存在
- `appendSessionData()` を呼び出し

### Step 4: Lint検証（--full モードのみ）

```bash
cd app && npm run lint
```

### Step 5: インポート解決確認

**クライアントコンポーネントで Node.js モジュールを直接インポートしていないか確認**:
- `hearing/page.tsx` が `sessionManager` を直接インポートしていない
- `additional-questions/page.tsx` が `sessionManager` を直接インポートしていない
- API経由で `appendSessionData` を呼び出している

</instructions>

## 検証手順

1. **ビルドテスト実行**:
   ```bash
   cd app && npm run build 2>&1 | tee /tmp/build-output.log
   ```

2. **結果を解析**:
   - エラーの有無を確認
   - 警告の重要度を確認

3. **ファイル存在確認**:
   ```bash
   # Globツールを使用して全ての必要なファイルを確認
   ```

4. **コード検証**:
   ```bash
   # Grepツールを使用して重要な関数/インポートを検証
   ```

## 出力形式

### 成功時:
```
✅ ヒアリング機能検証完了

【ビルド】
✓ TypeScriptビルド成功
✓ 型エラーなし

【ファイル】
✓ 新規作成ファイル: 6/6
✓ 修正ファイル: 1/1

【機能】
✓ HearingContext実装確認
✓ hearingJsonBuilder実装確認
✓ questionMapping実装確認
✓ API統合確認
✓ ページ統合確認

【構成】
✓ クライアント/サーバー分離OK
✓ インポート解決OK
```

### 失敗時:
```
❌ ヒアリング機能検証失敗

【エラー】
✗ TypeScriptビルドエラー
  - app/src/hearing/page.tsx:113 - Type error...

【推奨アクション】
1. エラーログを確認: /tmp/build-output.log
2. 型エラーを修正
3. 再度 /hearing:validate を実行
```

## ツール使用ガイド

- **Bash**: ビルドとLint実行
- **Glob**: ファイル存在確認
- **Grep**: コード内の関数/インポート検証
- **Read**: 詳細なコード検証（--full モード）

## エラーハンドリング

### ビルドエラー
- エラーログを保存
- エラー箇所を特定
- 修正方法を提案

### ファイル欠損
- 欠けているファイルをリスト表示
- 作成すべき内容を提示

### Lintエラー（--full モード）
- 重大度を分類
- 修正コマンドを提案
