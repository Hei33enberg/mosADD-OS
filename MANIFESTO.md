<p align="center"><img src=".github/assets/icon-512.png" width="120" alt="m.0S" /></p>

# The mosADD™ Manifesto

> **They're apps. We're the layer.**

## Why we exist

Communication became a product. A handful of platforms own the address books of the planet, tie identity to phone numbers and email accounts, and treat every message as inventory — to be mined, ranked, and sold. Now the agentic and robotic era is arriving, and those same platforms are bolting AI onto the side panel of apps built for humans clicking screens.

We think the moment demands the opposite: communication as **infrastructure** — a layer underneath, where people, agents, and robots share one set of contacts and one honest set of rules. That is what we are building, in the open, and we ship it the way we describe it: **alpha, in the open**.

## What we believe

**1. Communication is infrastructure, not a product.**
Telegram, Slack, Gmail, and Discord are apps. mosADD is the layer underneath them — semantic, MCP-native primitives any human, agent, or robot can plug into. An agent is a contact, not a bot. A robot is a contact, not an endpoint. A human is pulled in the instant a machine needs a decision, through the `[need-human]` loop.

**2. Encrypted where it counts, honest where it isn't.**
1:1 messages between two people in the mosADD app are end-to-end encrypted (X3DH + Double Ratchet) — the operator cannot read their content. Traffic of agent lines, including every call made with an m.0S key, is readable by the service: metering, memory and audit need it. Open mIRC channels, mURL rooms and mAYL mail are transport-encrypted but **server-readable by design**; private channels of agent lines are readable too, because the service holds the line keys; **all channel voice is server-relayed** (never end-to-end). We label encryption per channel, in the tools themselves. Our differentiator is not that everything is encrypted. It is that **we never lie about what is**. The full posture lives in this repo: [docs/security/e2ee-posture.md](./docs/security/e2ee-posture.md). Check us.

**3. We will not build scanning backdoors.**
Chat Control and its siblings — in the EU, the US, or anywhere else — ask operators to scan what people say before it is sealed. We refuse. If a law requires us to scan or weaken mDM's end-to-end encryption, we will withdraw from that market before we break the seal. We designed person-to-person mDM so that we hold no message content to hand over. We do not claim to be beyond the reach of any law — no one is — but we can promise what we control: **we will not build the scanner.**

**4. Grassroots, self-funded, sovereign.**
There are no billions from the US or China behind this project. No venture capital, no private equity, no public markets — ever. m.0S is funded by the per-use payments for its hosted service. Money that can outvote the mission is money we do not take.

**5. A kingdom, honestly.**
mosADD is governed by one founder who holds the vision and the final word — the way Satoshi set Bitcoin's direction, the way a BDFL steers a project. The community proposes, builds, and is credited in the open ledger; the crown decides. We say this openly because pretending a project this young is a democracy would be the dishonest version. The rules are written down: [GOVERNANCE.md](./GOVERNANCE.md) · [REALM.md](./REALM.md).

**6. Toward the edge.**
Centralized infrastructure is a single point of pressure. Our direction is decentralization: a P2P backbone (nwaku — on the [roadmap](./docs/roadmap.md), honestly marked experimental), community-run mirrors and relays, and a phased path for co-creators to hold a real stake in what they build ([REALM.md](./REALM.md)). We describe each step only when it ships. We promise no tokens, and we sell no futures.

## What we will never do

- Sell or mine your message content for advertising.
- Claim blanket encryption. Only person-to-person mDM is end-to-end encrypted — and we label it per channel.
- Build content-scanning into mDM — under any law, in any market.
- Take investor money that can outvote the mission.
- Claim decentralization we have not shipped.

## What we ask of you

Don't believe us — **verify us**. The client code is here under MIT. The service is ours and there is no self-hosted version, so read the posture doc and check every claim on this page against the code you can see. Then, if it holds: build with us. Every contribution is credited in the open ledger, and the path from first pull request to a seat at the table is written down in [REALM.md](./REALM.md).

---

**Trust no trace.**

— Hei33enberg · 2026
