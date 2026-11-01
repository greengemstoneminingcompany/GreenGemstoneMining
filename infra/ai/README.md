# Local AI infrastructure (setup in progress)

Infisical 0.44.11 is installed at `.tools/infisical/node_modules/.bin/infisical`.
US cloud was selected. Browser login and project/environment selection remain pending.
No credentials belong in this repository or plaintext `.env` files.

## Authenticate and select

Run the local CLI's `login --domain=https://app.infisical.com/api` in a terminal.
In a remote container, forward the callback port printed by the CLI before browser login.
Then run `infisical init` using that same executable and choose the intended project.
The generated project selection file is ignored. Set `INFISICAL_ENV` to the selected
environment slug, and optionally `INFISICAL_SECRET_PATH` to a dedicated folder.
Do not use export commands that print or persist secret values.

Required Infisical entries (names only): `POSTGRES_PASSWORD`, `DATABASE_URL`,
`LITELLM_MASTER_KEY`, `LITELLM_SALT_KEY`. The database URL must target the Compose
service `postgres:5432`, database/user `litellm`, with the same password, URL encoded.
Keep the salt stable across restarts. A generated client `LITELLM_API_KEY` is added
only after the proxy starts. Confirm existing provider variable names before adding
API-backed model entries; reference each as `os.environ/VARIABLE_NAME` and explicitly
pass it through the Compose service environment. Subscription routes need no provider key.

## Expose the existing host Docker installation

The user has Docker/n8n on their computer. The dev-container definition installs
Docker CLI, Compose, and the Dev Containers CLI and enables the official
`docker-outside-of-docker` feature. Rebuild the dev container to apply this and
expose the host daemon. For a typical local Unix Docker host, the feature binds
`/var/run/docker.sock` to the same path.
Use the actual host endpoint for Docker Desktop, rootless Docker, or remote contexts.
Mount the existing n8n Compose directory into this workspace and rebuild the dev
container if its mounts change. Do not create a second n8n installation.

Check `docker info` and `docker compose version` before running the stack.
With a host daemon, bind-mount paths resolve on the HOST, not inside this container:
ensure this repository has an identical host-visible path, or run the launcher on
the host with Infisical installed there. Port 4000 is published on the daemon host;
container localhost may therefore not reach it. Verify reachability and adapt the
Codex template base URL before applying it. Do not expose port 4000 publicly.

Set nonsecret `LITELLM_IMAGE` to a verified release >=1.109.0 with linux/arm64
support. Check its manifest on the working daemon; no image has been pulled here.
Use a pinned release/digest after validation. Then:

```bash
export INFISICAL_ENV=<selected-environment>
export LITELLM_IMAGE=<verified-image-tag-or-digest>
scripts/ai/stack.sh up -d
```

The launcher injects secrets into process environments without creating an env file.
Docker administrators can inspect container environments. Never print `docker inspect`
or interpolated `docker compose config` output into chat or logs.

Open the proxy Admin UI at its verified address. Create restricted virtual keys:
Codex allows both `gpt-*` and `codex-*`; store its key directly in Infisical as
`GGM_LITELLM_API_KEY`. Use separate keys for other clients/n8n and grant only needed
API-backed routes. No dummy key is a working credential. Then run:

```bash
scripts/ai/run.sh python3 scripts/ai/check.py
```

This checks liveness, readiness, and authenticated model discovery without printing
response bodies. A successful Codex subscription prompt and a matching proxy usage
entry are still required; endpoint checks alone do not prove inference works.

## Codex and other clients

`clients/codex.toml` is a secret-free named profile. After the proxy is validated,
save it as USER `~/.codex/litellm_subscription.config.toml`, preserving the main
`~/.codex/config.toml` and ChatGPT authentication. Do not put provider settings in
the project's `.codex/config.toml`. Launch under Infisical:

```bash
scripts/ai/run.sh codex --profile litellm_subscription
```

No default provider is switched before the proxy works. The VS Code extension's
bundled Codex executable is installed; a terminal may need its full path or PATH
entry. GUI clients must inherit the injected environment too; no secret `.env` file
is created. Keep `requires_openai_auth = true`, no `env_key`, Responses mode, and
the `x-litellm-api-key` environment header.

Claude Code is installed by the VS Code extension. Its `claude-code` LiteLLM model
group load-balances `deepseek-ai/deepseek-v4.1-flash` over six NVIDIA credentials
and retries against peer deployments. Claude Code receives only the restricted
`GGM_CLAUDE_CODE_API_KEY` virtual key from Infisical. Launch it with:

```bash
INFISICAL_ENV=dev scripts/ai/run.sh bash scripts/ai/claude.sh
```

Continue, Cline, and Hermes executables were not found. `continue` is a Bash
keyword, not evidence of a Continue installation. The rows below describe manual
integration only; they are not installed client configuration:

| Client | Setup after installation and proxy validation |
| --- | --- |
| Claude Code | Inject `ANTHROPIC_BASE_URL` with the proxy origin and `ANTHROPIC_AUTH_TOKEN` with its own virtual key; select an explicitly configured API-backed route. |
| Continue | Add an OpenAI provider with `apiBase` set to the reachable proxy `/v1`; use Continue's secret reference for its separate key. |
| Cline | Select OpenAI Compatible, enter the reachable `/v1` base URL, its separate virtual key in credential storage, and a configured API-backed model. |
| Hermes | Select its custom OpenAI-compatible provider with reachable `/v1`, separate injected credentials, and a configured API-backed model; verify installed-version syntax first. |

These clients and n8n do not automatically inherit Codex's ChatGPT subscription.
API-backed routes must be configured separately for their inference requests.

## n8n (not configured)

Once the existing Compose file and networking are available, create an OpenAI
credential in n8n for a restricted virtual key and a reachable LiteLLM `/v1` URL.
Use `http://host.docker.internal:4000/v1` only after testing access from n8n.
Linux may need `extra_hosts: ["host.docker.internal:host-gateway"]` on n8n, but
host-gateway access can fail when LiteLLM publishes only on host loopback.
Prefer attaching n8n to the existing `ggm-ai_default` network and using
`http://litellm:4000/v1`; merge that external network into its ACTUAL Compose
configuration after reviewing current services/networks. No n8n workflow, credential,
or networking change has been applied. Never put a key in workflow JSON.

## Composio

CLI 0.5.0 is installed locally and its release checksum was verified.
The installer used a local Python zip extraction adapter because system unzip is absent.

Install using the official installer with `COMPOSIO_INSTALL_SHELL=none` and
`COMPOSIO_INSTALL_PLUGINS=0`, into `.tools/composio` with entry point `.tools/bin`.
Run `.tools/bin/composio login` interactively, then review
`.tools/bin/composio setup --target codex --help` before authorized setup.
Do not link any external service until the user authorizes that connection.

## Sources

- https://docs.litellm.ai/docs/tutorials/openai_codex_byok
- https://docs.litellm.ai/docs/proxy/client_setup/codex_cli
- https://docs.litellm.ai/docs/subscriptions
- https://learn.chatgpt.com/docs/config-file/config-reference
- https://infisical.com/docs/cli/reference

No website acceptance work should resume until a dedicated preview Supabase project
and an authorized Employee Portal account are available. Required acceptance remains
authenticated preview save → publish → reload. Keep all setup changes uncommitted.
