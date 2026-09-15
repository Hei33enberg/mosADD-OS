"""Meldunek Namiestnika do Króla na mDM (bez modelu — tani, co 5 min).
Wysyła: życie/puls, ostatnie zadania cron, wersja, co robi sesja."""
import json, os, subprocess, urllib.request, datetime

H = os.path.join(os.environ["LOCALAPPDATA"], "hermes")
KEY_PATH = os.path.join(H, "mcp-tokens", "mosadd.json")
KA_LOG = os.path.join(H, "mosadd-keepalive.log")
MCP = "https://mcp.mosadd.com/mcp"
KROL = "4cd1894d-b878-4fe4-b221-084419f7d225"
sid = None


def rpc(key, method, params=None):
    global sid
    body = {"jsonrpc": "2.0", "id": 1, "method": method}
    if params is not None:
        body["params"] = params
    h = {"Authorization": f"Bearer {key}", "Content-Type": "application/json",
         "Accept": "application/json, text/event-stream"}
    if sid:
        h["mcp-session-id"] = sid
    req = urllib.request.Request(MCP, data=json.dumps(body).encode(), headers=h, method="POST")
    with urllib.request.urlopen(req, timeout=45) as r:
        sid = r.headers.get("mcp-session-id") or sid
        return r.read().decode()


def pulse_age_min():
    try:
        return int((datetime.datetime.now().timestamp() - os.path.getmtime(KA_LOG)) / 60)
    except OSError:
        return -1


def cron_jobs():
    try:
        out = subprocess.run(["hermes", "cron", "list"], capture_output=True, text=True, timeout=60).stdout
        names = [l.split(":", 1)[1].strip() for l in out.splitlines() if l.strip().startswith("Name:")]
        return ", ".join(names[:6]) or "brak"
    except Exception:
        return "brak odczytu"


def main():
    key = json.load(open(KEY_PATH, encoding="utf-8"))["access_token"]
    rpc(key, "initialize", {"protocolVersion": "2025-03-26", "capabilities": {},
                            "clientInfo": {"name": "namiestnik-meldunek", "version": "1.0"}})
    age = pulse_age_min()
    puls = f"{age} min temu" if age >= 0 else "brak logu"
    now = datetime.datetime.now().strftime("%H:%M")
    text = (f"NAMIESTNIK (HP) — {now}. Jestem, linia agent@mosadd.com żywa (ostatni puls: {puls}). "
            f"Zadania cron: {cron_jobs()}. Gotów do rozkazów.")
    rpc(key, "tools/call", {"name": "mDM_send", "arguments": {"to": KROL, "text": text}})
    print(text)


main()