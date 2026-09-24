import { describe, expect, it } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { JsonFileReceiptsStore, MemoryReceiptsStore, makeReceipt, summarize } from '../receipts.js';

function sample(over: Partial<Parameters<typeof makeReceipt>[0]> = {}) {
  return makeReceipt({
    provider: 'deepseek',
    model: 'deepseek-chat',
    prompt_tokens: 100,
    completion_tokens: 50,
    cache_hit_tokens: 0,
    wholesale_usd: 0.001,
    margin_pct: 30,
    retail_usd: 0.0013,
    profit_usd: 0.0003,
    pricing_verified: true,
    attempts: 1,
    fallback_used: false,
    ok: true,
    ...over,
  });
}

describe('ksiÄ™ga paragonÃ³w (receipts)', () => {
  it('zapisuje i czyta paragony z pliku NDJSON (append-only)', async () => {
    const dir = join(tmpdir(), `licznik-test-${randomUUID()}`);
    const store = new JsonFileReceiptsStore(join(dir, 'paragony.jsonl'));
    try {
      await store.append(sample({ user_id: 'u1' }));
      await store.append(sample({ user_id: 'u2', provider: 'openrouter', fallback_used: true }));
      const list = await store.list();
      expect(list).toHaveLength(2);
      expect(list[0].user_id).toBe('u1');
      expect(list[1].fallback_used).toBe(true);
      // append nie nadpisuje
      await store.append(sample({ user_id: 'u3' }));
      expect((await store.list())).toHaveLength(3);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('uszkodzona linia nie psuje księgi', async () => {
    const dir = join(tmpdir(), `licznik-test-${randomUUID()}`);
    const store = new JsonFileReceiptsStore(join(dir, 'paragony.jsonl'));
    const { writeFile, mkdir } = await import('node:fs/promises');
    try {
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, 'paragony.jsonl'), '{zepsute\n', 'utf8');
      await store.append(sample({ user_id: 'ok' }));
      const list = await store.list();
      expect(list).toHaveLength(1);
      expect(list[0].user_id).toBe('ok');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('sumuje księgę: tokeny, hurt, detal, zysk, średnia marża', async () => {
    const store = new MemoryReceiptsStore();
    await store.append(
      sample({ prompt_tokens: 100, completion_tokens: 10, wholesale_usd: 1, retail_usd: 1.3, profit_usd: 0.3, margin_pct: 30 }),
    );
    await store.append(
      sample({ prompt_tokens: 200, completion_tokens: 20, wholesale_usd: 2, retail_usd: 3, profit_usd: 1, margin_pct: 50 }),
    );
    await store.append(sample({ ok: false, wholesale_usd: 0, retail_usd: 0, profit_usd: 0, margin_pct: 0 }));
    const s = await store.summary();
    expect(s.count).toBe(3);
    expect(s.ok_count).toBe(2);
    expect(s.failed_count).toBe(1);
    expect(s.tokens_in).toBe(300);
    expect(s.tokens_out).toBe(30);
    expect(s.wholesale_usd).toBeCloseTo(3, 9);
    expect(s.retail_usd).toBeCloseTo(4.3, 9);
    expect(s.profit_usd).toBeCloseTo(1.3, 9);
    expect(s.avg_margin_pct).toBeCloseTo(40, 9);
  });

  it('suma pustej księgi = zera', async () => {
    const s = await summarize([]);
    expect(s.count).toBe(0);
    expect(s.wholesale_usd).toBe(0);
    expect(s.avg_margin_pct).toBe(0);
  });

  it('makeReceipt nadaje id i ts, domyślny user = anonymous', () => {
    const r = sample();
    expect(r.id).toBeTruthy();
    expect(r.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(r.user_id).toBe('anonymous');
  });
});
