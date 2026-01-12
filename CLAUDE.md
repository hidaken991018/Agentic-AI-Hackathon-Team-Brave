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

# Pythonスクリプトの実行
uv run python <スクリプト名>.py

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
    - 場所: ai/fp_agent.py
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
├── fp_agent.py                 # Agent Engine定義
├── test_agent.py               # エージェントテスト
└── create_agent.temp.py        # エージェント作成スクリプト

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
