# Local n8n

The migrated n8n 2.44.7 instance uses the dedicated Node runtime in
`.tools/n8n-runtime` and restored data in `n8n/migrated-runtime/.n8n`.

Start it from any directory with this workspace's `scripts/n8n/start.sh`.
The script reports when n8n is already ready; otherwise it runs in the foreground.
Keep that terminal open while using n8n. Ctrl+C stops an instance started there.
Open http://127.0.0.1:5678. In a remote workspace, forward port 5678 privately.

Readiness can be checked at http://127.0.0.1:5678/healthz/readiness.
The local HTTP setup binds to loopback and disables secure cookies.

The entire `/n8n/` directory is intentionally ignored by Git. Never add its
contents, including workflows, databases, credentials, logs, or backups, to Git.
Do not run a second instance against the same restored data directory.
