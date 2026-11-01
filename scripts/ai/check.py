#!/usr/bin/env python3
"""Check endpoints without printing credentials or response bodies."""
import os
import urllib.request
import urllib.error
import sys
base = os.environ.get("LITELLM_PROXY_URL", "http://localhost:4000").rstrip("/")
key = os.environ.get("GGM_LITELLM_API_KEY") or os.environ.get("LITELLM_API_KEY")
if not key:
    sys.exit("A LiteLLM virtual key must be injected by Infisical")
for path in ("/health/liveliness", "/health/readiness", "/v1/models"):
    request = urllib.request.Request(base + path, headers={"Authorization": "Bearer " + key})
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            print(path, response.status)
    except (urllib.error.URLError, TimeoutError):
        sys.exit(path + " failed; response body suppressed")
