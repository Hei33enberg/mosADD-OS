#!/usr/bin/env node
// npm bin for m0s: `npx -y @mosadd/m0s@<version> install` == `node m0s.mjs install`.
import { main } from '../m0s.mjs';

main().catch((e) => {
  process.stderr.write(`m0s: ${e.message}\n`);
  process.exitCode = 1;
});
