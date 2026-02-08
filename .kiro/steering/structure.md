# Project Structure

## Organization Philosophy

**機能別レイヤード構成** - フロントエンド/バックエンド（`app/`）は機能ごとにページを分割し、共通ロジックはレイヤーごとに整理（agents, libs, components, schema）。AI エージェント（`ai/`）とインフラ（`cloud/`）は独立したサブプロジェクト。

## Directory Patterns

### Frontend/Backend (`app/src/`)

#### Pages (`app/src/app/`)
**Location**: `app/src/app/[route]/`
**Purpose**: Next.js App Router のページコンポーネント。各ルートは独自の UI と処理を持つ
**Example**:
- `app/hearing/page.tsx` - ヒアリングページ
- `app/compass/page.tsx` - コンパス（結果表示）ページ
- `app/login/page.tsx` - ログインページ
- `app/quiz/page.tsx` - クイズページ
- `app/design-system/page.tsx` - デザインシステム確認用ページ（開発用）
- `app/poc-query-ai/page.tsx`, `app/auth-sample/page.tsx` - 検証用サンプルページ

#### API Routes (`app/src/app/api/`)
**Location**: `app/src/app/api/[endpoint]/route.ts`
**Purpose**: Next.js のサーバーサイド API エンドポイント
**Example**:
- `app/api/agent/query/route.ts` - AI エージェントクエリの統括エンドポイント

#### Agents (`app/src/agents/`)
**Location**: `app/src/agents/`
**Purpose**: AI エージェントとの連携ロジック（Vertex AI、Gemini API 呼び出し）
**Example**:
- `fpInstructor.ts` - Vertex AI Agent Engine 呼び出し
- `jsonEditor.ts` - Gemini API で JSON 生成/更新

#### Libraries (`app/src/libs/`)
**Location**: `app/src/libs/[domain]/`
**Purpose**: ドメインごとの共通ロジック（firebase, google, shadcn など）
**Example**:
- `libs/firebase/` - Firebase 初期化と認証
- `libs/google/` - GCP サービス連携（セッション管理、トークン取得、API 呼び出し）
- `libs/shadcn/utils.ts` - shadcn/ui ユーティリティ

#### Components (`app/src/components/`)
**Location**: `app/src/components/[category]/`
**Purpose**: 再利用可能な UI コンポーネント
**Example**:
- `components/ui/` - Button, Input, Card, Select, RadioGroup, Textarea など shadcn/ui ベースの UI プリミティブ
- `components/auth/AuthGuard.tsx` - 認証ガードコンポーネント

#### Schema (`app/src/schema/`)
**Location**: `app/src/schema/`
**Purpose**: Zod スキーマ定義（API レスポンス、JSON 構造のバリデーション）
**Example**: `hearingJsonSchema.ts` - ヒアリング JSON の型定義とバリデーション

#### Constants (`app/src/consts/`)
**Location**: `app/src/consts/`
**Purpose**: アプリケーション全体の定数（エンドポイント、プロンプト、メッセージ、設定）
**Example**: `endpoint.ts`, `prompt.ts`, `message.ts`, `setting.ts`

#### Context (`app/src/context/`)
**Location**: `app/src/context/`
**Purpose**: React Context API によるグローバル状態管理
**Example**: `AuthContext.tsx` - 認証状態の管理

### AI Agents (`ai/`)

**Location**: `ai/agents/`
**Purpose**: Vertex AI Agent Engine のエージェント定義ファイル
**Example**:
- `agents/fp_agent.py` - Financial Planner エージェント定義
- `deploy_agent.py` - 汎用デプロイスクリプト
- `config.py` - GCP 設定と環境変数

### Infrastructure (`cloud/`)

**Location**: `cloud/`
**Purpose**: Terraform による IaC 定義
**Example**:
- `main.tf` - メイン設定とバックエンド状態管理
- `apis.tf` - GCP API 有効化
- `cloudRun.tf` - Cloud Run デプロイ設定
- `database.tf` - Firestore + Cloud SQL 設定

## Naming Conventions

- **Files**: camelCase（TypeScript）, snake_case（Python）
- **Components**: PascalCase（例: `AuthGuard.tsx`, `MinInput.tsx`）
- **Functions/Variables**: camelCase（例: `queryGemini`, `createSessionId`）
- **Constants**: UPPER_SNAKE_CASE または camelCase（ファイル分割されている場合）

## Import Organization

```typescript
// External dependencies（外部ライブラリ）
import { GoogleGenerativeAI } from "@google/genai"
import { z } from "zod"

// Internal absolute imports（@/* エイリアス使用）
import { fpInstructor } from "@/agents/fpInstructor"
import { hearingJsonSchema } from "@/schema/hearingJsonSchema"
import { PROMPT } from "@/consts/prompt"

// Relative imports（同階層または下位階層のみ）
import { AuthGuard } from "./AuthGuard"
```

**Path Aliases**:
- `@/*`: `app/src/*` にマッピング（TypeScript）

## Code Organization Principles

### レイヤー分離
- **Presentation Layer**: `app/src/app/` と `app/src/components/` - UI ロジック
- **Business Logic Layer**: `app/src/agents/` - AI エージェント連携ロジック
- **Infrastructure Layer**: `app/src/libs/` - 外部サービス連携、ユーティリティ
- **Data Layer**: `app/src/schema/` - データ構造定義とバリデーション

### 依存方向
- 上位レイヤーは下位レイヤーに依存できる（Pages → Agents → Libs → Schema）
- 下位レイヤーは上位レイヤーに依存しない（Libs は Components を import しない）

### モノレポ構成
- 3 つのサブプロジェクト（`app/`, `ai/`, `cloud/`）は独立して開発・デプロイ可能
- 各サブプロジェクトは独自の依存関係管理とビルドプロセスを持つ

---
_created_at: 2026-01-16_
_updated_at: 2026-01-17_
