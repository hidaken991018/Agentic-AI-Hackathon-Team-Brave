#!/usr/bin/env python3
"""Create Agent Engine instance with agent identity only (no code deployment)."""

import argparse
import sys

import vertexai
from vertexai import agent_engines
from vertexai.preview.reasoning_engines import types


def create_agent_engine_with_identity(project_id: str, location: str) -> None:
    """Create Agent Engine instance with agent identity only.

    Args:
        project_id: GCP project ID
        location: GCP region (e.g., us-central1)
    """
    # Initialize Vertex AI
    vertexai.init(project=project_id, location=location)

    print(f"Creating Agent Engine in {project_id}/{location}...")

    # Create Agent Engine with identity_type only (no agent code)
    remote_app = agent_engines.create(
        agent=None,
        config={
            "identity_type": types.IdentityType.AGENT_IDENTITY,
        },
    )

    # Output results
    print("\n" + "=" * 60)
    print("Agent Engine created successfully!")
    print("=" * 60)
    print(f"Resource Name: {remote_app.resource_name}")
    print(f"Service Account: {remote_app.service_account}")
    print("=" * 60)

    # Output shell commands for next steps
    print("\n# Next steps - Run these commands to grant IAM roles:")
    print(f"export SERVICE_ACCOUNT=\"{remote_app.service_account}\"")
    print(f"export PROJECT_ID=\"{project_id}\"")
    print()
    print("# Grant recommended roles")
    print("gcloud projects add-iam-policy-binding $PROJECT_ID \\")
    print('    --member="serviceAccount:$SERVICE_ACCOUNT" \\')
    print('    --role="roles/aiplatform.expressUser"')
    print()
    print("gcloud projects add-iam-policy-binding $PROJECT_ID \\")
    print('    --member="serviceAccount:$SERVICE_ACCOUNT" \\')
    print('    --role="roles/serviceusage.serviceUsageConsumer"')


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create Agent Engine instance with agent identity only"
    )
    parser.add_argument(
        "--project-id",
        required=True,
        help="GCP project ID",
    )
    parser.add_argument(
        "--location",
        default="us-central1",
        help="GCP region (default: us-central1)",
    )

    args = parser.parse_args()

    try:
        create_agent_engine_with_identity(args.project_id, args.location)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()