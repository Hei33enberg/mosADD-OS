import { defineConfig } from 'vitest/config';

// M0S_ENDPOINTS=off: no test reaches the live hub for its address list; the list tests turn it on with local servers.
export default defineConfig({ test: { testTimeout: 30_000, env: { M0S_ENDPOINTS: 'off' } } });
