#!/usr/bin/env python3
"""ADKエージェントコードを Agent Engine にデプロイする"""

import vertexai
from google.adk.agents import Agent
from vertexai.agent_engines import AdkApp

# プロジェクト設定
PROJECT_ID = "fifth-boulder-481807-f8"
LOCATION = "us-central1"
STAGING_BUCKET = "gs://fifth-boulder-481807-f8-agent-staging"


def main():
    """ADKエージェントコードをデプロイする"""

    # Vertex AI を初期化（AdkApp の前に必要）
    vertexai.init(project=PROJECT_ID, location=LOCATION)

    # Vertex AI Client を初期化
    client = vertexai.Client(project=PROJECT_ID, location=LOCATION)

    print("ADK エージェントを作成中...")
    # ADK Agent を作成
    agent = Agent(
        model="gemini-2.0-flash-exp",
        name="sample_agent",
    )

    # AdkApp でラップ
    adk_app = AdkApp(agent=agent)

    print("Agent Engine を新規作成してデプロイ中...")
    print("（この処理には数分かかります）")
    print()

    # 新しい Agent Engine を作成
    agent_engine = client.agent_engines.create(
        agent=adk_app,
        config={
            "display_name": "sample-agent-adk",
            "requirements": [
                "google-cloud-aiplatform[agent_engines,adk]",
                "pydantic",
                "cloudpickle",
            ],
            "staging_bucket": STAGING_BUCKET,
        }
    )

    print()
    print("=" * 60)
    print("[OK] エージェントのデプロイが完了しました！")
    print("=" * 60)
    print()
    print("test_agent.py の RESOURCE_NAME を以下に更新してください:")
    print(f'RESOURCE_NAME = "{agent_engine.api_resource.name}"')
    print()
    print("その後、動作確認:")
    print('  uv run python test_agent.py')


if __name__ == "__main__":
    main()
