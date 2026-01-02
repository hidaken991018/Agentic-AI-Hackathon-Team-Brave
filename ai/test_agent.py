#!/usr/bin/env python3
"""デプロイされたエージェントの動作確認"""

import asyncio
import vertexai

# プロジェクト設定
PROJECT_ID = "fifth-boulder-481807-f8"
LOCATION = "us-central1"
RESOURCE_NAME = "projects/803525069908/locations/us-central1/reasoningEngines/4561659338875207680"
USER_ID = "test-user-001"


async def main():
    """エージェントの動作を確認する"""
    # Vertex AI を初期化
    vertexai.init(project=PROJECT_ID, location=LOCATION)

    # Vertex AI Client を初期化
    client = vertexai.Client(project=PROJECT_ID, location=LOCATION)

    print("Agent Engine を取得中...")
    # TODO: この処理に時間がかかる原因を調査
    # issue:https://github.com/hidaken991018/Agentic-AI-Hackathon-Team-Brave/issues/111
    agent_engine = client.agent_engines.get(name=RESOURCE_NAME)

    print(f"Agent Engine: {agent_engine.api_resource.name}")
    print()

    # テストクエリ
    test_query = "こんにちは、調子はどうですか？"

    print(f"クエリ: {test_query}")
    print()
    print("エージェントにクエリを送信中...")

    try:
        # セッションを作成してクエリを送信
        print()
        print("=" * 60)
        print("レスポンス:")
        print("=" * 60)

        # async_stream_query でストリーミング応答を取得
        async for event in agent_engine.async_stream_query(
            user_id=USER_ID,
            message=test_query,
        ):
            print(event)

        print("=" * 60)
        print()
        print("[OK] エージェントは正常に動作しています！")

    except Exception as e:
        print(f"[ERROR] エラーが発生しました: {e}")
        print()
        print("エージェントがまだデプロイされていない可能性があります。")
        print("以下を実行してください:")
        print("  uv run python deploy_sample_agent.py")


if __name__ == "__main__":
    asyncio.run(main())
