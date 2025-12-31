#!/usr/bin/env python3
"""エージェントコードなしでAgent Engineインスタンスを作成する（agent identity のみ）"""

import argparse
import sys

import vertexai
from vertexai import agent_engines


def create_agent_engine_with_identity(
    project_id: str, location: str, display_name: str = None
) -> None:
    """エージェント ID のみで Agent Engine インスタンスを作成する。

    Args:
        project_id: GCP プロジェクト ID
        location: GCP リージョン（例: us-central1）
        display_name: Agent Engine の表示名（オプション）
    """
    # Vertex AI を初期化
    vertexai.init(project=project_id, location=location)

    if display_name:
        print(f"Creating Agent Engine '{display_name}' in {project_id}/{location}...")
    else:
        print(f"Creating Agent Engine in {project_id}/{location}...")

    # デフォルト identity で Agent Engine を作成（エージェントコードなし）
    # agent_engine=None を指定すると、agent identity を持つ空の Agent Engine が作成される
    remote_app = agent_engines.create(
        agent_engine=None,
        display_name=display_name,
    )

    # 結果を出力
    print("\n" + "=" * 60)
    print("Agent Engine created successfully!")
    print("=" * 60)
    print(f"Resource Name: {remote_app.resource_name}")
    print("=" * 60)
    print()
    print("次のステップは agent-engine-setup.md を参照してください。")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="エージェント ID のみで Agent Engine インスタンスを作成"
    )
    parser.add_argument(
        "--project-id",
        required=True,
        help="GCP プロジェクト ID",
    )
    parser.add_argument(
        "--location",
        default="us-central1",
        help="GCP リージョン（デフォルト: us-central1）",
    )
    parser.add_argument(
        "--display-name",
        help="Agent Engine の表示名（例: hearing-agent）",
    )

    args = parser.parse_args()

    try:
        create_agent_engine_with_identity(
            args.project_id, args.location, args.display_name
        )
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()