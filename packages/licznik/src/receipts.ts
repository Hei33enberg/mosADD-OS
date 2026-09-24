/**
 * LICZNIK — księga paragonów.
 * Każde żądanie przez bramę zostawia paragon: użytkownik, model, tokeny,
 * koszt hurtowy, marża %, cena detaliczna, zysk.
 *
 * Magazyn bazowy = plik NDJSON (append-only): odporny na współbieżność,
 * prosty do backupu, zero zależności od bazy. Adapter do bazy (Supabase)
 * wpięty zostanie po FINALE apki (fala wdrożeniowa).
 */

import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, appendFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export interface Receipt {
  id: string;
  /** ISO timestamp */
  ts: string;
  /** właściciel żądania (id użytkownika mosADD; 'anonymous' gdy nie podano) */
  user_id: string;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  cache_hit_tokens: number;
  /** koszt hurtowy USD */
  wholesale_usd: number;
  margin_pct: number;
  /** cena detaliczna USD */
  retail_usd: number;
  /** zysk USD */
  profit_usd: number;
  /** czy cena modelu jest potwierdzona (verified) — false = nie rozliczać */
  pricing_verified: boolean;
  /** ile kroków łańcucha wykonano zanim dostawca odpowiedział */
  attempts: number;
  /** czy użyto fallbacku (primary nie odpowiedział) */
  fallback_used: boolean;
  ok: boolean;
  error?: string;
}

export interface ReceiptsSummary {
  count: number;
  ok_count: number;
  failed_count: number;
  tokens_in: number;
  tokens_out: number;
  wholesale_usd: number;
  retail_usd: number;
  profit_usd: number;
  avg_margin_pct: number;
  fallback_count: number;
}

/** interfejs magazynu — jedna prawda dla pliku, pamięci i przyszłej bazy */
export interface ReceiptsStore {
  append(receipt: Receipt): Promise<void>;
  list(): Promise<Receipt[]>;
  summary(): Promise<ReceiptsSummary>;
}

export function makeReceipt(
  input: Omit<Receipt, 'id' | 'ts' | 'user_id'> & { user_id?: string },
): Receipt {
  return {
    id: randomUUID(),
    ts: new Date().toISOString(),
    user_id: input.user_id ?? 'anonymous',
    provider: input.provider,
    model: input.model,
    prompt_tokens: input.prompt_tokens,
    completion_tokens: input.completion_tokens,
    cache_hit_tokens: input.cache_hit_tokens,
    wholesale_usd: input.wholesale_usd,
    margin_pct: input.margin_pct,
    retail_usd: input.retail_usd,
    profit_usd: input.profit_usd,
    pricing_verified: input.pricing_verified,
    attempts: input.attempts,
    fallback_used: input.fallback_used,
    ok: input.ok,
    error: input.error,
  };
}

export function summarize(receipts: Receipt[]): ReceiptsSummary {
  const ok = receipts.filter((r) => r.ok);
  let tokensIn = 0;
  let tokensOut = 0;
  let wholesale = 0;
  let retail = 0;
  let profit = 0;
  let marginSum = 0;
  let fallback = 0;
  for (const r of ok) {
    tokensIn += r.prompt_tokens;
    tokensOut += r.completion_tokens;
    wholesale += r.wholesale_usd;
    retail += r.retail_usd;
    profit += r.profit_usd;
    marginSum += r.margin_pct;
    if (r.fallback_used) fallback += 1;
  }
  return {
    count: receipts.length,
    ok_count: ok.length,
    failed_count: receipts.length - ok.length,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    wholesale_usd: wholesale,
    retail_usd: retail,
    profit_usd: profit,
    avg_margin_pct: ok.length > 0 ? marginSum / ok.length : 0,
    fallback_count: fallback,
  };
}

/** Magazyn plikowy NDJSON (append-only). Domyślny dla dev i smoke testów. */
export class JsonFileReceiptsStore implements ReceiptsStore {
  constructor(private filePath: string) {}

  private async ensureDir(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
  }

  async append(receipt: Receipt): Promise<void> {
    await this.ensureDir();
    await appendFile(this.filePath, JSON.stringify(receipt) + '\n', 'utf8');
  }

  async list(): Promise<Receipt[]> {
    if (!existsSync(this.filePath)) return [];
    const raw = await readFile(this.filePath, 'utf8');
    const out: Receipt[] = [];
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t) continue;
      try {
        out.push(JSON.parse(t) as Receipt);
      } catch {
        /* uszkodzona linia nie psuje księgi */
      }
    }
    return out;
  }

  async summary(): Promise<ReceiptsSummary> {
    return summarize(await this.list());
  }
}

/** Magazyn w pamięci — do testów i środowisk bez trwałego dysku. */
export class MemoryReceiptsStore implements ReceiptsStore {
  private items: Receipt[] = [];

  async append(receipt: Receipt): Promise<void> {
    this.items.push(receipt);
  }

  async list(): Promise<Receipt[]> {
    return [...this.items];
  }

  async summary(): Promise<ReceiptsSummary> {
    return summarize(this.items);
  }
}
