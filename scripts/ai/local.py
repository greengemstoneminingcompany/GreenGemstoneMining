#!/usr/bin/env python3
"""Native container bootstrap. Credentials stay in process memory.
Run under Infisical for stable gateway keys; bootstrap keys are session-only.
"""
import os, pathlib, secrets, signal, subprocess, sys, time, urllib.request
import psycopg
from psycopg import sql
root = pathlib.Path(__file__).resolve().parents[2]
state = root / ".tools/ai-runtime"
state.mkdir(mode=0o700, exist_ok=True)
pg = root / ".tools/postgres/usr/lib/postgresql/16/bin"
env = os.environ.copy()
# Click maps the generic DEBUG environment variable to LiteLLM's boolean
# --debug option. Some dev containers set DEBUG=release, which is invalid.
env.pop("DEBUG", None)
env["LD_LIBRARY_PATH"] = str(root / ".tools/postgres/usr/lib/aarch64-linux-gnu")
env["PATH"] = str(root / ".tools/litellm-venv/bin") + os.pathsep + env.get("PATH", "")
data = state / "postgres"
socket = state / "socket"
socket.mkdir(mode=0o700, exist_ok=True)
def run(*args):
    subprocess.run([str(a) for a in args], env=env, check=True, stdout=subprocess.DEVNULL)
if not (data / "PG_VERSION").exists():
    run(pg / "initdb", "-D", data, "--no-locale", "--encoding=UTF8", "--auth-local=trust", "--auth-host=scram-sha-256")
status = subprocess.run([str(pg / "pg_ctl"), "-D", str(data), "status"], env=env, stdout=subprocess.DEVNULL)
if status.returncode:
    run(pg / "pg_ctl", "-D", data, "-l", state / "postgres.log", "-o", f"-k {socket} -p 55432 -h 127.0.0.1", "-w", "start")
password = secrets.token_urlsafe(32)
with psycopg.connect(host=str(socket), port=55432, dbname="postgres", autocommit=True) as conn:
    conn.execute(sql.SQL("ALTER USER {} PASSWORD {}").format(sql.Identifier(os.environ.get("USER", "pwuser")), sql.Literal(password)))
    if not conn.execute("SELECT 1 FROM pg_database WHERE datname='litellm'").fetchone():
        conn.execute("CREATE DATABASE litellm")
env["DATABASE_URL"] = f"postgresql://{os.environ.get('USER', 'pwuser')}:{password}@127.0.0.1:55432/litellm"
if env.get("GGM_LITELLM_MASTER_KEY"):
    env["LITELLM_MASTER_KEY"] = env["GGM_LITELLM_MASTER_KEY"]
if env.get("GGM_LITELLM_SALT_KEY"):
    env["LITELLM_SALT_KEY"] = env["GGM_LITELLM_SALT_KEY"]
bootstrap = not env.get("LITELLM_MASTER_KEY")
env.setdefault("LITELLM_MASTER_KEY", "sk-" + secrets.token_urlsafe(32))
env["STORE_MODEL_IN_DB"] = "True"
log = open(state / "litellm.log", "a")
os.chmod(state / "litellm.log", 0o600)
proxy = subprocess.Popen([str(root / ".tools/litellm-venv/bin/litellm"), "--config", str(root / "infra/ai/litellm.yaml"), "--host", "127.0.0.1", "--port", "4000"], env=env, stdout=log, stderr=log)
stopping = False
def stop(*_):
    global stopping
    if stopping:
        return
    stopping = True
    if proxy.poll() is None:
        proxy.terminate()
        try:
            proxy.wait(timeout=30)
        except subprocess.TimeoutExpired:
            proxy.kill()
            proxy.wait(timeout=10)
    sys.exit(0)
signal.signal(signal.SIGTERM, stop)
signal.signal(signal.SIGINT, stop)
for attempt in range(180):
    if proxy.poll() is not None:
        sys.exit("LiteLLM exited; inspect private runtime log locally.")
    try:
        for path in ("/health/liveliness", "/health/readiness", "/v1/models"):
            req = urllib.request.Request("http://127.0.0.1:4000" + path, headers={"Authorization": "Bearer " + env["LITELLM_MASTER_KEY"]})
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status != 200:
                    raise RuntimeError("not ready")
        print("LiteLLM ready: liveness, readiness, authenticated models all HTTP 200", flush=True)
        print("Bootstrap mode: session-only admin credential; Infisical stable keys and client virtual key still required." if bootstrap else "Infisical master key active.", flush=True)
        break
    except Exception:
        time.sleep(1)
else:
    stop()
sys.exit(proxy.wait())
