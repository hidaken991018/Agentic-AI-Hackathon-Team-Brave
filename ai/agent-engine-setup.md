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
uv run python create_agent_id.py \
    --project-id YOUR_PROJECT_ID \
    --location us-central1 \
    --display-name hearing-agent
```

**オプション**:

- `--display-name`: Agent Engine の表示名（例: `hearing-agent`, `planning-agent` など）

出力例:

```
Creating Agent Engine in YOUR_PROJECT_ID/us-central1...
Identified the following requirements: {'pydantic': '2.12.5', 'cloudpickle': '3.1.2'}
...

============================================================
Agent Engine created successfully!
============================================================
Resource Name: projects/123456789/locations/us-central1/reasoningEngines/4593827750569050112
============================================================

次のステップは agent-engine-setup.md を参照してください。
```

**Resource Name からプロジェクト番号を確認**:

- 例: `projects/123456789/locations/us-central1/reasoningEngines/xxxxx`
- この場合、`PROJECT_NUMBER` は `123456789`

### Step 2: Service Account を確認

Agent Engine はデフォルトの **Vertex AI Service Agent** を使用します。

**Service Account の形式**:

```
service-<PROJECT_NUMBER>@gcp-sa-aiplatform-re.iam.gserviceaccount.com
```

### Step 3: IAM ロールを付与

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

### Step 4: IAM 設定を確認

> **注**: このステップも初回のみで十分です（確認のため）。

```bash
gcloud projects get-iam-policy YOUR_PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:service-<PROJECT_NUMBER>@gcp-sa-aiplatform-re.iam.gserviceaccount.com" \
    --format="table(bindings.role)"
```

### Step 5: エージェントコードを追加

> **注**: このステップは**各 Agent Engine ごとに実行が必要**です。
>
> - 各 Agent Engine は独立したインスタンスです
> - それぞれに異なるエージェントコード（hearing-agent, planning-agent など）をデプロイします

IAM 設定完了後、エージェントコードを追加してデプロイします。

サンプルコード：`ai\create_agent.temp.py`

## 複数の Agent Engine を作成する場合

同じプロジェクトで 2 つ目以降の Agent Engine を作成する場合の手順：

```
【1つ目の Agent Engine】
✓ Step 1: エージェント ID 作成
✓ Step 2: Service Account 確認
✓ Step 3: IAM ロール付与（初回のみ）
✓ Step 4: IAM 設定確認（初回のみ）
✓ Step 5: エージェントコード追加

【2つ目以降の Agent Engine】
✓ Step 1: エージェント ID 作成
✗ Step 2: Service Account 確認（スキップ可能）
✗ Step 3: IAM ロール付与（スキップ可能）
✗ Step 4: IAM 設定確認（スキップ可能）
✓ Step 5: エージェントコード追加
```

## 利用可能なリージョン

- `us-central1`
- `europe-west1`
- `asia-northeast1`

詳細は [Vertex AI Agent Engine ドキュメント](https://cloud.google.com/agent-builder/agent-engine/overview) を参照してください。
