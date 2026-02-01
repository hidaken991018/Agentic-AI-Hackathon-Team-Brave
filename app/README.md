## Node.js/npmのバージョン管理

本プロジェクトでは Volta を用いたNode.js/npm のバージョン管理にも対応する。

### (1) Volta のインストール

ターミナルより以下のコマンドで Volta をインストールする。※インストール後、ターミナルを再起動する。

`curl https://get.volta.sh | bash`

### (2) バージョン確認を行う

`node -v`を実行し、 `package.json` に記載のバージョンと同一であることを確認する。
もし相違がある場合には、パスが通っていない可能性がある。

#### パス通し(1) パス設定

~/.zshrc に以下を追記（すでにあれば順番だけ確認）

`export VOLTA_HOME="$HOME/.volta"`
`export PATH="$VOLTA_HOME/bin:$PATH"`

#### パス通し(2)反映

`source ~/.zshrc`：現在のシェルへも設定を適用する。
`hash -r`：Node.js のバージョンキャッシュを削除する。

#### パス通し(3) 確認

`node -v`を実行し、 `package.json` に記載のバージョンと同一であることを確認する。

## データベース（PostgreSQL/Firestore）の起動

### (1)Docker Desktop を起動する

[Docker Desktop](https://matsuand.github.io/docs.docker.jp.onthefly/desktop/mac/install/)を起動する（要インストール）。

### (2)docker-compose.yaml と同一階層へ移動する。

以下のコマンド（`~`の部分は自身のローカルディレクトリで読み替える）を実行し、docker-compose.yaml が存在するディレクトリへ移動する。

`mv ~/app`

### (3)docker コンテナを起動する

以下のコマンドで docker コンテナを起動する。

`docker compose -p life-compass up --build -d`

その後、Docker Desktop の `Containers` にて `life-compass` が表示されていれば OK。

### ※動作確認

#### 動作確認(1)PostgreSQL

以下のコマンドを実行し、DB 内に入れることを確認する。

`docker exec -it local-postgres psql -U myuser -d mydb`

#### 動作確認(2)Firestore

以下の URL へブラウザ経由でアクセスし、エミュレーターが表示されることを確認する。

`http://localhost:4000`

## ローカル環境でのAIエージェント/Gemini APIを実行する方法

以下のコマンドを実行し、GCP Auth へログインする。

```
gcloud auth application-default login
```

自動的に `application_default_credentials.json` がローカルに作成される。準備完了。

### ※GCP Auth からログアウト

GCP Auth からログアウトするためには以下をコマンドする。
gcloud auth application-default revoke

## ローカル環境でのアプリ起動方法

### クイックスタート

```bash
# 1. 依存関係のインストール
cd app
npm install

# 2. Prisma Client の生成
npx prisma generate

# 3. Docker（PostgreSQL/Firestore）の起動
docker compose -p life-compass up --build -d

# 4. データベースのマイグレーション
npx prisma migrate dev

# 5. 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:3000` を開く。

### 前提条件

- Node.js（package.json に記載のバージョン）
- Docker Desktop
- GCP CLI（`gcloud`）
- GCP プロジェクトへのアクセス権限

## 環境変数の設定

### .env.local（ローカル開発用）

`app/.env.local` ファイルを作成し、以下の環境変数を設定する。

```bash
# GCP 共通
GCP_PROJECT_NUMBER=<GCPプロジェクト番号>

# Vertex AI（AI エージェント）
VERTEX_AGT_LOCATION=us-central1
VERTEX_AGT_RESOURCE_NAME=projects/<プロジェクト番号>/locations/us-central1/reasoningEngines/<エンジンID>

# Vertex AI（Gemini）
VERTEX_GEMINI_MODEL=gemini-2.5-flash
VERTEX_GEMINI_LOCATION=us-central1

# Firebase（フロントエンド）
NEXT_PUBLIC_FIREBASE_API_KEY=<Firebase APIキー>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<Firebase Authドメイン>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<Firebase プロジェクトID>
NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL=<Firebase クライアントメール>
NEXT_PUBLIC_FIREBASE_APP_ID=<Firebase アプリID>

# Firebase（バックエンド）
FIREBASE_PROJECT_ID=<Firebase プロジェクトID>
FIREBASE_CLIENT_EMAIL=<Firebase クライアントメール>
FIREBASE_PRIVATE_KEY=<Firebase 秘密鍵（改行は\nでエスケープ）>

# データベース（ローカル PostgreSQL）
DATABASE_URL=postgresql://myuser:P@ssw0rd!@localhost:5432/life-compass-postgres
```

#### 環境変数の説明

| Key | 説明 | 取得方法 |
|-----|------|----------|
| `GCP_PROJECT_NUMBER` | GCPプロジェクト番号 | GCPコンソール > ダッシュボード |
| `VERTEX_AGT_LOCATION` | Agent Engineのリージョン | デプロイ先リージョン |
| `VERTEX_AGT_RESOURCE_NAME` | Agent Engineのリソース名 | `ai/deploy_agent.py` 実行後に取得 |
| `VERTEX_GEMINI_MODEL` | Geminiモデル名 | `gemini-2.5-flash` 等 |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase設定（公開可） | Firebase Console > プロジェクト設定 |
| `FIREBASE_*` | Firebase設定（秘密） | Firebase Console > サービスアカウント |
| `DATABASE_URL` | PostgreSQL接続文字列 | ローカルはDocker設定に合わせる |

### Secret Manager（GCP本番環境用）

Cloud Run にデプロイする場合、以下のシークレットを GCP Secret Manager に設定する。

| Key | 説明 | 値の形式 |
|-----|------|----------|
| `DATABASE_URL` | Cloud SQL接続文字列 | `postgresql://USER:PASS@localhost/DB?host=/cloudsql/PROJECT:REGION:INSTANCE` |

#### DATABASE_URL の形式（ローカル vs GCP）

| 環境 | 形式 |
|------|------|
| ローカル | `postgresql://myuser:P@ssw0rd!@localhost:5432/life-compass-postgres` |
| GCP (Cloud Run) | `postgresql://app_user:PASSWORD@localhost/life_compass?host=/cloudsql/PROJECT:REGION:INSTANCE` |

※ Cloud Run は Unix ソケット経由で Cloud SQL に接続するため、`?host=/cloudsql/...` パラメータが必要。

### GitHub Secrets（CI/CD用）

GitHub Actions でのデプロイに必要な Secrets。

| Key | 説明 |
|-----|------|
| `GCP_PROJECT_ID` | GCPプロジェクトID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity プロバイダー |
| `GCP_SERVICE_ACCOUNT` | サービスアカウント |
| `GCP_ALLOWED_USERS` | Cloud Run アクセス許可ユーザー（カンマ区切り） |
| `DB_PASSWORD` | Cloud SQL ユーザーパスワード |
| `DATABASE_URL` | Cloud SQL接続文字列（マイグレーション用、TCP形式） |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API キー |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth ドメイン |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase プロジェクトID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase アプリID |
| `BASIC_AUTH_USER` | Basic認証ユーザー名 |
| `BASIC_AUTH_PASSWORD` | Basic認証パスワード |

## 開発コマンド一覧

### アプリケーション

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run lint     # ESLint実行
npm run start    # 本番サーバー起動
```

### Prisma（データベース）

```bash
npx prisma generate              # Prisma Client生成（型定義）
npx prisma migrate dev --name <名前>  # マイグレーション作成＋適用
npx prisma migrate deploy        # マイグレーション適用のみ（本番用）
npx prisma studio                # GUI でデータ確認
```

### JSON スキーマ

```bash
npm run gen:json                 # 全スキーマのサンプルJSON生成
npm run gen:json -- <スキーマ名>  # 特定スキーマのみ生成
npm run gen:json -- list         # 利用可能なスキーマ一覧
```

### Docker（ローカルDB）

```bash
docker compose -p life-compass up --build -d   # コンテナ起動
docker compose -p life-compass down            # コンテナ停止
docker exec -it local-postgres psql -U myuser -d life-compass-postgres  # PostgreSQL接続
```
