# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

家計や人生設計の支援を行うアプリケーション（Life Compass）です。複数の AI エージェントを組み合わせたシステムで、Google Cloud を使った Agentic AI Hackathon 向けに開発されています。

### 技術スタック

**フロントエンド/バックエンド (app/):**

- Next.js 16.1.1 + React 19.2.3, TypeScript（strict mode）
- Tailwind CSS 4
- Firebase Authentication
- Google Gemini API (@google/genai)
- データベース: Firestore + PostgreSQL 15（Cloud SQL）
- Node.js 24.12.0

**AI エージェント (ai/):**

- Python 3.11
- Google Cloud AI Platform with Agent Engine（agent-engines, adk）
- Vertex AI SDK
- パッケージマネージャー: UV（pip ではない）

**インフラ (cloud/):**

- Terraform（IaC）
- GCP サービス: Cloud Run, Vertex AI, Firestore, Cloud SQL, Cloud Scheduler
- リージョン: asia-northeast1（日本）

## 開発コマンド

### フロントエンド/バックエンド (app/)

```bash
# 開発サーバー起動
cd app
npm run dev          # Next.js開発サーバーを起動

# ビルドとLint
npm run build        # 本番用ビルド
npm run lint         # ESLint実行

# 本番サーバー起動
npm run start
```

### Python AI エージェント (ai/)

**重要: `pip` ではなく `uv` を使用すること**

```bash
cd ai

# 依存関係のインストール（初回のみ）
uv sync

# エージェントのデプロイ
uv run python deploy_agent.py fp_agent        # FPエージェント
uv run python deploy_agent.py sample_agent    # サンプルエージェント

# エージェントのテスト
uv run python test_agent.py

# リントとフォーマット
uv run ruff check .          # Lint
uv run ruff format .         # Format
uv run mypy .                # Type check
```

### データベースのセットアップ（ローカル開発）

```bash
cd app

# PostgreSQL + Firestore エミュレータを起動
docker compose -p life-compass up --build -d

# PostgreSQL の動作確認
docker exec -it local-postgres psql -U myuser -d mydb

# Firestore エミュレータの動作確認
# ブラウザで http://localhost:4000 を開く
```

### インフラ (cloud/)

```bash
cd cloud

# Terraformの初期化
terraform init

# 変更内容の確認
terraform plan

# 変更の適用
terraform apply
```

### GCP 認証（ローカルで AI/Gemini API を使う場合は必須）

```bash
# ログイン
gcloud auth application-default login
# application_default_credentials.json が自動作成される

# ログアウト
gcloud auth application-default revoke
```

## アーキテクチャ

### マルチエージェントシステムのフロー

アプリケーションは 2 段階の AI エージェントパイプラインを使用しています：

```
ユーザー入力
    ↓
[1] FP Instructor Agent（Python/Vertex AI Agent Engine）
    - モデル: Gemini 2.5 Flash
    - 役割: ファイナンシャルプランナーとして指示を生成
    - 場所: ai/agents/fp_agent.py
    - API: app/src/app/api/agent/query/route.ts
    ↓
[2] JSON Editor Agent（TypeScript/Gemini API）
    - FPエージェントの指示を受け取る
    - ヒアリングスキーマに基づいてJSONを生成/更新
    - バリデーション: Zodスキーマ（app/src/app/schema/）
    - 場所: app/src/app/agents/jsonEditor.ts
    ↓
JSONレスポンス（hearingJsonSchemaで検証済み）
```

### 主要なエントリーポイント

**メイン API エンドポイント:**

- `app/src/app/api/agent/query/route.ts` - 両方のエージェントを統括する POST エンドポイント

**エージェント実装:**

- `app/src/app/agents/fpInstructor.ts` - Vertex AI Agent Engine を呼び出す
- `app/src/app/agents/jsonEditor.ts` - Gemini API で JSON 生成

**セッション管理:**

- `app/src/app/libs/google/createSessionId.ts` - 会話セッションの作成/管理
- ユーザーの各会話は継続性のために`sessionId`を保持

**認証:**

- `app/src/app/context/AuthContext.tsx` - 認証状態の React コンテキスト
- `app/src/app/libs/firebase/` - Firebase 認証の初期化

### ディレクトリ構造

```
app/src/app/
├── api/agent/query/route.ts    # メインAPIエンドポイント
├── agents/                      # エージェントオーケストレーション
│   ├── fpInstructor.ts         # Vertex AI Agent Engine
│   └── jsonEditor.ts           # Gemini API JSON生成
├── components/auth/            # 認証UIコンポーネント
├── consts/                     # 定数（プロンプト、エンドポイント）
├── context/AuthContext.tsx     # 認証状態管理
├── libs/
│   ├── firebase/               # Firebase認証セットアップ
│   └── google/                 # GCP連携
│       ├── createSessionId.ts
│       ├── getAccessToken.ts
│       ├── queryAIAgent.ts     # Vertex AIクエリ
│       └── queryGemini.ts      # Gemini API呼び出し
├── schema/                     # Zodバリデーションスキーマ
└── [pages]/                    # Next.jsページ

ai/
├── config.py                   # GCP設定と環境変数
├── deploy_agent.py             # 汎用エージェントデプロイスクリプト
├── test_agent.py               # エージェントテスト
└── agents/                     # エージェント定義
    ├── __init__.py
    ├── fp_agent.py            # Financial Plannerエージェント定義
    └── sample_agent.py        # サンプルエージェント定義

cloud/
├── main.tf                     # Terraform設定、バックエンド状態管理
├── apis.tf                     # GCP API有効化
├── cloudRun.tf                 # Cloud Runデプロイ
└── database.tf                 # Firestore + Cloud SQL
```

## 注意事項

### パスエイリアス

TypeScript は`@/*`エイリアスを`./src/*`に使用（`app/tsconfig.json`で設定）。

例: `import { fpInstructor } from "@/app/agents/fpInstructor"`

### コード品質

- ESLint と Prettier 統合（app/）
- Ruff でリント/フォーマット（ai/）
- MyPy で静的型チェック（ai/）


# AI-DLC とスペック駆動開発

AI-DLC（AI Development Life Cycle）上での Kiro スタイルのスペック駆動開発の実装

## プロジェクトコンテキスト

### パス
- ステアリング: `.kiro/steering/`
- スペック: `.kiro/specs/`

### ステアリング vs スペック

**ステアリング** (`.kiro/steering/`) - プロジェクト全体のルールとコンテキストで AI をガイド
**スペック** (`.kiro/specs/`) - 個別の機能の開発プロセスを形式化

### アクティブなスペック
- アクティブなスペックは `.kiro/specs/` を確認
- 進捗確認には `/kiro:spec-status [feature-name]` を使用

## 開発ガイドライン
- 英語で考え、日本語で回答を生成すること。プロジェクトファイルに書き込まれるすべての Markdown コンテンツ（requirements.md、design.md、tasks.md、research.md、検証レポートなど）は、このスペックに設定されたターゲット言語で記述する必要があります（spec.json.language を参照）。

## 最小限のワークフロー
- Phase 0（オプション）: `/kiro:steering`, `/kiro:steering-custom`
- Phase 1（仕様策定）:
  - `/kiro:spec-init "description"`
  - `/kiro:spec-requirements {feature}`
  - `/kiro:validate-gap {feature}`（オプション: 既存のコードベース向け）
  - `/kiro:spec-design {feature} [-y]`
  - `/kiro:validate-design {feature}`（オプション: 設計レビュー）
  - `/kiro:spec-tasks {feature} [-y]`
- Phase 2（実装）: `/kiro:spec-impl {feature} [tasks]`
  - `/kiro:validate-impl {feature}`（オプション: 実装後）
- 進捗確認: `/kiro:spec-status {feature}`（いつでも使用可能）

## 開発ルール
- 3 フェーズ承認ワークフロー: 要件 → 設計 → タスク → 実装
- 各フェーズで人間のレビューが必要。意図的にファストトラックする場合のみ `-y` を使用
- ステアリングを最新に保ち、`/kiro:spec-status` で整合性を確認
- ユーザーの指示に正確に従い、その範囲内で自律的に行動する: 必要なコンテキストを収集し、重要な情報が欠けている場合や指示が致命的に曖昧な場合のみ質問して、この実行で最初から最後まで要求された作業を完了する。

## ステアリング設定
- `.kiro/steering/` 全体をプロジェクトメモリとして読み込む
- デフォルトファイル: `product.md`, `tech.md`, `structure.md`
- カスタムファイルもサポート（`/kiro:steering-custom` で管理）
