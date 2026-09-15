"""Skrzynka NAMIESTNIKA (agent@mosadd.com, HP): nowe mDM + zalaczniki/obrazy.
Tryb monitor cron: brak nowych = 'BRAK_NOWYCH' (agent nie rusza), nowe = zmiana outputu.
Zalaczniki: wypisuje URL/typ, zeby agent mogl je pobrac i przeczytac (vision).
"""
import json, os, urllib.request

H = os.path.join(os.environ["LOCALAPPDATA"], "hermes")
TOKEN_PATH = os.path.join(H, "mcp-tokens", "mosadd.json")
STATE = os.path.join(H, "namiestnik-inbox-state.json")
MCP = "https://mcp.mosadd.com/mcp"
ME = "6cfdd9ad-33d2-40fe-9b75-bfae8eb23ac9"      # agent@mosadd.com
CONTACTS = {
    "4cd1894d-b878-4fe4-b221-084419f7d225": "SOVEREIGN (Król)",
    "ebfa40aa-fe78-481e-9003-d32d4b0aa7bf": "DYSPOZYTOR (Lenovo)",
}
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


def body_of(m):
    return (m.get("text") or m.get("body") or m.get("caption") or "").strip()


def extras_of(m):
    out = []
    for k in ("attachment", "attachments", "media", "file", "media_url", "url", "mime_type", "kind"):
        v = m.get(k)
        if v:
            out.append(f"{k}={json.dumps(v, ensure_ascii=False)[:300]}")
    return out


def main():
    with open(TOKEN_PATH, encoding="utf-8") as f:
        key = json.load(f)["access_token"]
    rpc(key, "initialize", {"protocolVersion": "2025-03-26", "capabilities": {},
                            "clientInfo": {"name": "namiestnik-inbox", "version": "1.0"}})
    try:
        seen = set(json.load(open(STATE)).get("ids", []))
    except Exception:
        seen = set()

    new = []
    ids = list(seen)
    for cid, name in CONTACTS.items():
        try:
            out = rpc(key, "tools/call", {"name": "mDM_list", "arguments": {"contact_id": cid, "limit": 8}})
            payload = json.loads(out[out.index("{"):])
            data = json.loads(payload["result"]["content"][0]["text"])
        except Exception:
            continue
        for m in data.get("messages") or []:
            mid = m.get("id") or m.get("message_id")
            sender = m.get("sender_identity_id") or ""
            if not mid or mid in seen or sender == ME:
                continue
            ids.append(mid)
            txt = body_of(m)
            ext = extras_of(m)
            if txt or ext:
                block = f"- [{name}] {m.get('timestamp','')}: {txt[:1500]}"
                if ext:
                    block += "\n  ZALACZNIK: " + " | ".join(ext)
                new.append(block)

    json.dump({"ids": ids[-200:]}, open(STATE, "w"))
    print("BRAK_NOWYCH" if not new else "NOWE WIADOMOSCI:\n" + "\n".join(new))


main()