# Technology Stack

## Architecture

**モノレポ構成** - フロントエンド/バックエンド（`app/`）、AI エージェント（`ai/`）、インフラ（`cloud/`）の 3 つのサブプロジェクトで構成。各サブプロジェクトは独立して開発・デプロイ可能。

**マルチエージェントパイプライン** - Vertex AI Agent Engine と Gemini API を連携させた 2 段階処理：
1. FP Instructor Agent（Python/Vertex AI）が質問・指示を生成
2. JSON Editor Agent（TypeScript/Gemini API）が JSON を生成/更新

## Core Technologies

### Frontend/Backend (`app/`)
- **Language**: TypeScript（strict mode 有効）
- **Framework**: Next.js 16.1.1 + React 19.2.3
- **Runtime**: Node.js 24.12.0（Volta で管理）
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui パターン
- **Database**: Firestore + PostgreSQL 15（Cloud SQL）

### AI Agents (`ai/`)
- **Language**: Python 3.11
- **Platform**: Google Cloud AI Platform with Agent Engine
- **SDK**: Vertex AI SDK, agent-engines, adk
- **Package Manager**: UV（`pip` ではない）

### Infrastructure (`cloud/`)
- **IaC**: Terraform
- **Services**: Cloud Run, Vertex AI, Firestore, Cloud SQL, Cloud Scheduler
- **Region**: asia-northeast1（東京）

## Key Libraries

- **Authentication**: Firebase Authentication
- **AI Integration**: @google/genai（Gemini API）, Vertex AI SDK
- **Validation**: Zod 4.x（スキーマ定義とランタイム検証）
- **Styling Utilities**: clsx, tailwind-merge（条件付きクラス）
- **Icons**: lucide-react

## Development Standards

### Type Safety
- TypeScript strict mode 必須（`noEmit`, `strict` 有効）
- `any` の使用は避け、明示的な型定義を行う
- Zod を使ったランタイム型検証

### Code Quality
- **Linter**: ESLint + Prettier（統合設定）
- **Formatter**: Prettier（Tailwind CSS プラグイン使用）
- **Python**: Ruff（lint + format）+ MyPy（type check）
- **Import 管理**: unused-imports プラグインで未使用 import を削除

### Testing
- TBD（現在テストフレームワークは未設定）

## Development Environment

### Required Tools
- Node.js 24.12.0（Volta 推奨）
- Python 3.11+
- UV（Python パッケージマネージャー）
- gcloud CLI（GCP 認証用）
- Docker（ローカル DB 起動用）

### Common Commands
```bash
# Frontend/Backend
cd app
npm run dev          # Next.js 開発サーバー
npm run build        # 本番ビルド
npm run lint         # ESLint 実行

# AI Agents
cd ai
uv sync              # 依存関係インストール
uv run python deploy_agent.py fp_agent  # エージェントデプロイ
uv run ruff check .  # Lint
uv run mypy .        # Type check

# Infrastructure
cd cloud
terraform init
terraform plan
terraform apply

# Local Database
cd app
docker compose -p life-compass up --build -d
```

## Key Technical Decisions

### パスエイリアス
TypeScript では `@/*` を `./src/*` にマッピング（`tsconfig.json` で設定）。絶対 import を推奨。

```typescript
import { fpInstructor } from "@/agents/fpInstructor"  // ✅ Good
import { fpInstructor } from "../../agents/fpInstructor"  // ❌ Avoid
```

### エージェント統合パターン
- Next.js API Routes（`app/src/app/api/agent/query/route.ts`）でエージェント呼び出しを統括
- セッション ID による会話履歴管理（`createSessionId.ts`）
- バリデーション済み JSON を返却（`hearingJsonSchema.ts`）

### 認証フロー
- Firebase Authentication でユーザー認証
- AuthContext（React Context）で認証状態をグローバル管理
- AuthGuard コンポーネントで保護されたページへのアクセス制御

---
_created_at: 2026-01-16_
