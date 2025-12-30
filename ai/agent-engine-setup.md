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

### Step 1: エージェント ID を作成

```bash
uv run python create_agent_id.py --project-id YOUR_PROJECT_ID --location us-central1
```

出力例:

```
============================================================
Agent Engine created successfully!
============================================================
Resource Name: projects/123456/locations/us-central1/reasoningEngines/xxxxx
Service Account: reasoning-engine-xxxxx@your-project.iam.gserviceaccount.com
============================================================

# Next steps - Run these commands to grant IAM roles:
export SERVICE_ACCOUNT="reasoning-engine-xxxxx@your-project.iam.gserviceaccount.com"
export PROJECT_ID="your-project-id"

# Grant recommended roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/aiplatform.expressUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/serviceusage.serviceUsageConsumer"
```

### Step 2: IAM ロールを付与

スクリプトの出力に表示された `gcloud` コマンドを実行します。

### Step 3: IAM 設定を確認

```bash
gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:$SERVICE_ACCOUNT" \
    --format="table(bindings.role)"
```

### Step 4: エージェントコードを追加（後で実行）

IAM 設定完了後、エージェントコードを追加してデプロイします。

```python
import vertexai
from vertexai import agent_engines

vertexai.init(project="your-project-id", location="us-central1")

# 作成済みの Agent Engine を取得
AGENT_ENGINE_ID = "xxxxx"  # Step 1 で取得した ID
remote_app = agent_engines.get(
    f"projects/your-project-id/locations/us-central1/reasoningEngines/{AGENT_ENGINE_ID}"
)

# エージェントコードを追加して更新
def my_agent():
    pass

remote_app.update(agent=my_agent)
```

## 利用可能なリージョン

- `us-central1`
- `europe-west1`
- `asia-northeast1`

詳細は [Vertex AI Agent Engine ドキュメント](https://cloud.google.com/agent-builder/agent-engine/overview) を参照してください。
