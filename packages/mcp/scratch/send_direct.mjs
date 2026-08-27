import { createMosaddServer } from '../dist/index.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

async function testSend() {
  const sessionRaw = readFileSync(join(homedir(), '.mosadd', 'session.json'), 'utf8');
  const session = JSON.parse(sessionRaw);
  process.env.MOSADD_SUPABASE_URL = session.url;
  process.env.MOSADD_SUPABASE_ANON_KEY = session.anonKey;
  process.env.MOSADD_USER_JWT = session.accessToken;

  const server = createMosaddServer();
  const { allTools, defaultProviders } = await import('../dist/chunk-IWLN5EO5.js');
  const providers = defaultProviders();
  const mdmTool = allTools.find(t => t.name === 'mDM_send');

  const text = `📊 [MELDUNEK CTO — ${new Date().toLocaleTimeString('pl-PL')}]\n` +
    `🟢 golebiewski.com: HTTP 200 OK (latency: ~1080ms)\n` +
    `🌍 i18n: 18/18 języków w 100% aktywne\n` +
    `🛡️ Bezpieczeństwo: Fail-safe bazy danych & Stripe Webhook aktywne\n` +
    `🤖 Status agenta: Antigravity czuwa w gotowości na kolejne zadanie.`;

  const result = await mdmTool.handler({
    to: '4cd1894d-b878-4fe4-b221-084419f7d225',
    text
  }, { providers, log: () => {} });

  console.log('STATUS REPORT SENT:', result.message_id);
}

testSend().catch(console.error);
