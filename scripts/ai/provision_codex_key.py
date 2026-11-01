#!/usr/bin/env python3
"""Create a restricted Codex virtual key and store it in Infisical."""

import json
import os
import pathlib
import subprocess
import tempfile
import urllib.request


root = pathlib.Path(__file__).resolve().parents[2]
master = os.environ.get("GGM_LITELLM_MASTER_KEY")
if not master:
    raise SystemExit("GGM_LITELLM_MASTER_KEY must be injected by Infisical")

payload = json.dumps(
    {
        "key_alias": "ggm-codex-subscription",
        "models": ["gpt-*", "codex-*"],
    }
).encode()
request = urllib.request.Request(
    "http://127.0.0.1:4000/key/generate",
    data=payload,
    method="POST",
    headers={
        "Authorization": "Bearer " + master,
        "Content-Type": "application/json",
    },
)
with urllib.request.urlopen(request, timeout=30) as response:
    result = json.load(response)
key = result.get("key")
if not isinstance(key, str) or not key.startswith("sk-"):
    raise SystemExit("LiteLLM did not return a virtual key")

runtime = root / ".tools/ai-runtime"
runtime.mkdir(mode=0o700, exist_ok=True)
temporary_name = None
try:
    with tempfile.NamedTemporaryFile(
        mode="w", dir=runtime, prefix="infisical-", suffix=".env", delete=False
    ) as temporary:
        temporary_name = temporary.name
        os.chmod(temporary_name, 0o600)
        temporary.write("GGM_LITELLM_API_KEY=" + key + "\n")
    subprocess.run(
        [
            str(root / ".tools/infisical/node_modules/.bin/infisical"),
            "secrets",
            "set",
            "--domain=https://app.infisical.com/api",
            "--env=dev",
            "--path=/",
            "--file",
            temporary_name,
        ],
        cwd=root,
        check=True,
        stdout=subprocess.DEVNULL,
    )
finally:
    if temporary_name:
        pathlib.Path(temporary_name).unlink(missing_ok=True)

models_request = urllib.request.Request(
    "http://127.0.0.1:4000/v1/models",
    headers={"Authorization": "Bearer " + key},
)
with urllib.request.urlopen(models_request, timeout=30) as response:
    if response.status != 200:
        raise SystemExit("Virtual-key model discovery failed")
print("Codex virtual key stored in Infisical and /v1/models returned HTTP 200")
