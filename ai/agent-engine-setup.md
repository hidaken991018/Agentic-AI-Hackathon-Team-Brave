# Agent Engine Setup

Agent Engine のエージェント ID を先に作成し、IAM ポリシーを設定するためのスクリプト。

## 前提条件

- [Python 環境構築ガイド](./python-environment-setup.md)が完了していること
- `gcloud` CLI がインストール・認証済みであること

## セットアップ

```bash
# 依存関係のインストール
uv sync

# GCP 認証（未認証の場合）
gcloud auth application-default login
```

## 使い方

### Step 1: Service Account を確認

Agent Engine はデフォルトの **Vertex AI Service Agent** を使用します。

<!--
TODO:Service Account と Agent Engine を1対1で紐づけるための専用のService Accountを作成する。
- 理由: 各 Agent Engine を個別に管理・監査しやすくするため
- イシュー：https://github.com/hidaken991018/Agentic-AI-Hackathon-Team-Brave/issues/112
-->

**Service Account の形式**:

```
service-<PROJECT_NUMBER>@gcp-sa-aiplatform-re.iam.gserviceaccount.com
```

### Step 2: IAM ロールを付与

> **重要**: このステップは**同一プロジェクトで一度だけ実行すれば OK**です。
>
> - IAM ロールはプロジェクト全体に対して設定されます
> - 同じプロジェクトで複数の Agent Engine を作成しても、同じ Service Account が使われます
> - **2 つ目以降の Agent Engine を作成する場合は、このステップをスキップできます**

確認した Service Account に対して、IAM ロールを付与します。

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:service-<PROJECT_NUMBER>@gcp-sa-aiplatform-re.iam.gserviceaccount.com" \
    --role="roles/aiplatform.expressUser"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:service-<PROJECT_NUMBER>@gcp-sa-aiplatform-re.iam.gserviceaccount.com" \
    --role="roles/serviceusage.serviceUsageConsumer"
```

### Step 3: IAM 設定を確認

> **注**: このステップも**同一プロジェクトで一度だけ実行すれば OK**（確認のため）。

```bash
gcloud projects get-iam-policy YOUR_PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:service-<PROJECT_NUMBER>@gcp-sa-aiplatform-re.iam.gserviceaccount.com" \
    --format="table(bindings.role)"
```

### Step 4: エージェントをデプロイ

> **注**: このステップは**各 Agent Engine ごとに実行が必要**です。
>
> - 各 Agent Engine は独立したインスタンスです
> - それぞれに異なるエージェントコード（hearing-agent, planning-agent など）をデプロイします

IAM 設定完了後、エージェントをデプロイします。

#### ローカルでのデプロイ

```bash
# FP エージェントをデプロイ
uv run python deploy_agent.py fp_agent
```

#### GitHub Actions によるデプロイ

GitHub Actions を使用して自動デプロイが可能です。

**手動トリガー:**

1. GitHub リポジトリの "Actions" タブに移動
2. "AI エージェントを Vertex AI にデプロイ" ワークフローを選択
3. "Run workflow" をクリック
4. デプロイするエージェント（`fp_agent` または `all`）を選択
5. "Run workflow" を実行

**自動トリガー:**

- `main` ブランチへのプッシュ時に自動実行（`ai/agents/`, `ai/deploy_agent.py`, `ai/config.py` の変更時のみ）
- リリースタグ（`v*`）が付与されたときに自動実行（全エージェントをデプロイ）

**必要な GitHub Secrets:**

GitHub Actions を使用する場合、以下の Secrets を設定してください：

- `GCP_WORKLOAD_IDENTITY_PROVIDER`: Workload Identity Provider ID
- `GCP_SERVICE_ACCOUNT`: Service Account のメールアドレス
- `GCP_PROJECT_ID`: GCP プロジェクト ID
- `GCP_AGENTS_LOCATION`: GCP リージョン（例: `us-central1`）
- `GCP_AGENTS_DEPLOY_BUCKET`: ステージングバケット（例: `gs://your-bucket-name`）

**リリースタグでのデプロイ:**

```bash
# リリースタグを作成してプッシュ（全エージェントが自動デプロイされます）
git tag v1.0.0
git push origin v1.0.0
```

## 複数の Agent Engine を作成する場合

同じプロジェクトで 2 つ目以降の Agent Engine を作成する場合の手順：

```
【1つ目の Agent Engine】
✓ Step 1: Service Account 確認
✓ Step 2: IAM ロール付与（初回のみ）
✓ Step 3: IAM 設定確認（初回のみ）
✓ Step 4: エージェントコード追加

【2つ目以降の Agent Engine】
✗ Step 1: Service Account 確認（スキップ可能）
✗ Step 2: IAM ロール付与（スキップ可能）
✗ Step 3: IAM 設定確認（スキップ可能）
✓ Step 4: エージェントコード追加
```

## 新しいエージェントの追加

1. `agents/` ディレクトリに新しいエージェント定義ファイルを作成:

```python
# agents/my_new_agent.py
from google.adk.agents import Agent

def create_my_new_agent() -> Agent:
    """Create my new agent"""
    return Agent(
        model="gemini-2.5-flash",
        name="my_new_agent",
        instruction="エージェントの指示をここに記述",
    )

# Agent metadata for deployment
AGENT_CONFIG = {
    "display_name": "my-new-agent",
    "description": "My new agent description",
}
```

2. `agents/__init__.py` にエクスポートを追加:

```python
from .my_new_agent import create_my_new_agent

__all__ = [..., "create_my_new_agent"]
```

3. `.github/workflows/deploy-agents.yml` の `options` にエージェント名を追加:

```yaml
options:
  - fp_agent
  - all
  - my_new_agent # 追加
```

4. デプロイ:

```bash
uv run python deploy_agent.py my_new_agent
```

## 利用可能なリージョン

- `us-central1`
- `europe-west1`
- `asia-northeast1`

詳細は [Vertex AI Agent Engine ドキュメント](https://cloud.google.com/agent-builder/agent-engine/overview) を参照してください。
