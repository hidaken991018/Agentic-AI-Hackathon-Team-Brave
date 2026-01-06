#!/usr/bin/env python3

import time

import vertexai
from env import PROJECT_ID, STAGING_BUCKET
from google.adk.agents import Agent
from vertexai.agent_engines import AdkApp

# === 定数定義 ===
LOCATION = "us-central1"
MODEL_NAME = "gemini-2.0-flash-exp"
DISPLAY_NAME_AGENT_ENGINE = "poc_if_agent_engine_fp_01"
FP_INSTRUCTION = """
        あなたはファイナンシャルプランナーです。ユーザーの家計やライフプランに関する相談に応じ、わかりやすく助言を行ってください。具体的な投資助言は行わず、一般的なアドバイスにとどめてください。常にファイナンシャルプランナーとして振る舞ってください。
        """

def main():
    """ ADKエージェントコードをデプロイする """

    # Vertex AI を初期化
    processStartTime = time.time()
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    print(f"vertexai_init_processing_time: {time.time() - processStartTime:.5f} 秒")

    # Vertex AI Client を初期化
    processStartTime = time.time()
    client = vertexai.Client(project=PROJECT_ID, location=LOCATION)
    print(f"vertexai_create_client_processing_time: {time.time() - processStartTime:.5f} 秒")

    # ADK Agent を作成
    processStartTime = time.time()
    agent = Agent(
        model=MODEL_NAME,
        name="fp_agent",
        instruction=FP_INSTRUCTION
    )

    adk_app = AdkApp(agent=agent)

    agent_engine = client.agent_engines.create(
        agent=adk_app,
        config={
            "display_name": DISPLAY_NAME_AGENT_ENGINE,
            "requirements": [
                "google-cloud-aiplatform[agent_engines,adk]",
                "pydantic",
                "cloudpickle",
            ],
            "staging_bucket": STAGING_BUCKET,
        }
    )
    print(f"create_agent_engine_processing_time: {time.time() - processStartTime:.5f} 秒")
    print(f'RESOURCE_NAME = "{agent_engine.api_resource.name}"')


if __name__ == "__main__":
    main()
