#!/usr/bin/env python3
"""汎用Agent Engineデプロイスクリプト"""

import argparse
import importlib
import sys
import time
from typing import Any

import vertexai
from google.adk.agents import Agent
from vertexai.agent_engines import AdkApp

from config import DEFAULT_REQUIREMENTS, LOCATION, PROJECT_ID, AGENTS_DEPLOY_BUCKET


def import_agent_module(agent_name: str) -> Any:
    """
    エージェントモジュールを動的にインポートする

    Args:
        agent_name: エージェント名 (例: 'fp_agent', 'sample_agent')

    Returns:
        インポートされたエージェントモジュール

    Raises:
        ImportError: エージェントモジュールがインポートできない場合
    """
    try:
        module = importlib.import_module(f"agents.{agent_name}")
        return module
    except ImportError as e:
        print(f"エラー: エージェント '{agent_name}' をインポートできませんでした")
        print(f"agents/{agent_name}.py が存在することを確認してください")
        raise e


def deploy_agent(agent_name: str) -> None:
    """
    ADKエージェントをAgent Engineにデプロイする

    Args:
        agent_name: デプロイするエージェント名
    """
    print(f"エージェントをデプロイ中: {agent_name}")
    print("=" * 60)

    # エージェントモジュールをインポート
    agent_module = import_agent_module(agent_name)

    # エージェント作成関数を取得
    if not hasattr(agent_module, f"create_{agent_name}"):
        print(f"エラー: モジュールに create_{agent_name}() 関数がありません")
        sys.exit(1)

    # エージェント設定を取得
    if not hasattr(agent_module, "AGENT_CONFIG"):
        print(f"エラー: モジュールに AGENT_CONFIG がありません")
        sys.exit(1)

    create_agent_fn = getattr(agent_module, f"create_{agent_name}")
    agent_config = agent_module.AGENT_CONFIG

    # Vertex AIを初期化
    print(f"Vertex AI を初期化中...")
    start_time = time.time()
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    print(f"  完了 ({time.time() - start_time:.2f} 秒)")

    # Vertex AIクライアントを作成
    print(f"Vertex AI クライアントを作成中...")
    start_time = time.time()
    client = vertexai.Client(project=PROJECT_ID, location=LOCATION)
    print(f"  完了 ({time.time() - start_time:.2f} 秒)")

    # エージェントを作成
    print(f"ADK エージェントの設定を取得中...")
    agent: Agent = create_agent_fn()

    # AdkAppでラップ
    adk_app = AdkApp(agent=agent)

    # デプロイ設定を準備
    deploy_config = {
        "display_name": agent_config.get("display_name", agent_name),
        "requirements": DEFAULT_REQUIREMENTS,
        "staging_bucket": AGENTS_DEPLOY_BUCKET,
    }

    # 既存のエージェントを確認
    print()
    print(f"既存のエージェントを確認中...")
    existing_agent = None
    try:
        for agent_engine in client.agent_engines.list():
            # api_resource経由でdisplay_nameにアクセス
            engine_display_name = getattr(agent_engine.api_resource, 'display_name', None)
            if engine_display_name == deploy_config["display_name"]:
                existing_agent = agent_engine
                print(f"  既存のエージェントが見つかりました: {agent_engine.api_resource.name}")
                break
    except Exception as e:
        print(f"  警告: エージェントリストの取得中にエラーが発生しました: {e}")

    # Agent Engineにデプロイまたは更新
    print()
    if existing_agent:
        #既に存在する場合は更新
        print(f"Agent Engine を更新中...")
        print(f"  表示名: {deploy_config['display_name']}")
        print(f"  リソース名: {existing_agent.api_resource.name}")
        print()

        start_time = time.time()
        agent_engine = client.agent_engines.update(
            name=existing_agent.api_resource.name,
            agent=adk_app,
            config=deploy_config
        )
        action = "更新"
    else:
        print(f"Agent Engine へ新規作成中...")
        print(f"  表示名: {deploy_config['display_name']}")
        print(f"  エージェントデプロイバケット: {AGENTS_DEPLOY_BUCKET}")
        print()

        start_time = time.time()
        agent_engine = client.agent_engines.create(agent=adk_app, config=deploy_config)
        action = "新規作成"

    # 結果を出力
    print()
    print("=" * 60)
    print(f"[成功] エージェントの{action}が完了しました！")
    print("=" * 60)
    print()
    print(f"エージェントリソース名:")
    print(f'  {agent_engine.api_resource.name}')
    print()
    print(f"このエージェントを使用するには、アプリケーションで RESOURCE_NAME を設定してください:")
    print(f'  RESOURCE_NAME = "{agent_engine.api_resource.name}"')
    print()


def main() -> None:
    """メインエントリーポイント"""
    parser = argparse.ArgumentParser(
        description="ADKエージェントをAgent Engineにデプロイ",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  # FPエージェントをデプロイ
  uv run python deploy_agent.py fp_agent

  # サンプルエージェントをデプロイ
  uv run python deploy_agent.py sample_agent
        """,
    )

    parser.add_argument(
        "agent_name",
        help="デプロイするエージェント名 (例: 'fp_agent', 'sample_agent')",
    )

    args = parser.parse_args()

    try:
        deploy_agent(args.agent_name)
    except Exception as e:
        print()
        print("=" * 60)
        print("[エラー] デプロイに失敗しました")
        print("=" * 60)
        print(f"エラー: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
