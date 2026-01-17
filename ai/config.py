#!/usr/bin/env python3
"""Agent Engine設定"""

from dotenv import load_dotenv
import os

# GCPプロジェクト設定
load_dotenv()

PROJECT_ID = os.getenv("GCP_PROJECT_ID")
LOCATION = os.getenv("GCP_AGENTS_LOCATION")
AGENTS_DEPLOY_BUCKET = os.getenv("GCP_AGENTS_DEPLOY_BUCKET")
print(f"Using PROJECT_ID: {PROJECT_ID}")
print(f"Using LOCATION: {LOCATION}")
print(f"Using AGENTS_DEPLOY_BUCKET: {AGENTS_DEPLOY_BUCKET}")

# Agent Engineのデフォルト依存関係
DEFAULT_REQUIREMENTS = [
    "google-cloud-aiplatform[agent_engines,adk]",
    "pydantic",
    "cloudpickle",
]
