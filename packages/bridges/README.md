# @mosadd/bridges

> **Experimental scaffold — NOT shipped, not part of the mosadd product surface.**
> This package is an internal interface stub. The adapters throw
> `BridgeNotImplementedError` from every handler — the TypeScript shape is locked,
> no network is wired, and bridges are **not** advertised as a mosadd feature.
> Do not depend on this package. The shipped product is the 6 live `m*` modules in
> [`@mosadd/mcp`](../mcp).

## What this is

A uniform `BridgeProvider` interface (`verifyConfig`, `sendMessage`, `listMessages`,
`resolveHandle`) kept here so a future contributor has a stable seam to build against.
Design-adopted from the [Hermes Agent](https://github.com/NousResearch/Hermes-Agent)
(MIT, Nous Research) `gateway/platforms/` pattern — see the project
[NOTICE](../../NOTICE) for attribution.

```ts
import { getBridge, type BridgeProvider } from "@mosadd/bridges";
// every handler currently throws BridgeNotImplementedError
```

Adding a real provider requires an accepted RFC (see [GOVERNANCE.md](../../GOVERNANCE.md)).

## License

Apache-2.0. See [LICENSE](../../LICENSE) and [NOTICE](../../NOTICE).
