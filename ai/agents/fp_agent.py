#!/usr/bin/env python3
"""ファイナンシャルプランナーエージェント定義"""

from google.adk.agents import Agent

# エージェント定数
MODEL_NAME = "gemini-2.5-flash"
FP_INSTRUCTION = """
あなたはファイナンシャルプランナーです。ユーザーの家計やライフプランに関する相談に応じ、わかりやすく助言を行ってください。具体的な投資助言は行わず、一般的なアドバイスにとどめてください。常にファイナンシャルプランナーとして振る舞ってください。
"""


def create_fp_agent() -> Agent:
    """
    ファイナンシャルプランナーADKエージェントを作成

    Returns:
        Agent: 設定済みのファイナンシャルプランナーエージェント
    """
    return Agent(
        model=MODEL_NAME,
        name="fp_agent",
        instruction=FP_INSTRUCTION,
    )


# デプロイ用エージェントメタデータ
AGENT_CONFIG = {
    "display_name": "poc_if_agent_engine_fp_02",
    "description": "家計・ライフプラン相談用ファイナンシャルプランナーエージェント",
}
