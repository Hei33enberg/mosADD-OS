/**
 * POST /api/licznik/chat — brama proxy LICZNIK.
 * Tor produktu RAMKA+SKLEP (LINEAR-6045, fala 0): deepseek direct primary,
 * fallback openrouter/gemini. Każde żądanie zostawia paragon z marżą.
 *
 * Auth: nagłówek `x-licznik-token` = env LICZNIK_ADMIN_TOKEN (tajny,
 * ustawiany po stronie wdrożenia — nigdy w repo). Brak konfiguracji = 503.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  runChain,
  computeWholesale,
  applyMargin,
  makeReceipt,
  DEFAULT_MARGIN_PCT,
  type ChainMessage,
} from '@mosadd/licznik';
import { licznikStore } from '../../../../lib/licznik-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authError() {
  return NextResponse.json({ error: 'LICZNIK nieaktywny: LICZNIK_ADMIN_TOKEN nie skonfigurowany' }, { status: 503 });
}

export async function POST(req: NextRequest) {
  const adminToken = process.env.LICZNIK_ADMIN_TOKEN;
  if (!adminToken) return authError();
  if (req.headers.get('x-licznik-token') !== adminToken) {
    return NextResponse.json({ error: 'nieautoryzowane' }, { status: 401 });
  }

  let body: { messages?: ChainMessage[]; model?: string; user_id?: string; margin_pct?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'body musi być JSON' }, { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: 'messages wymagane' }, { status: 400 });
  }

  const marginPct = typeof body.margin_pct === 'number' && body.margin_pct >= 0 ? body.margin_pct : DEFAULT_MARGIN_PCT;
  const env = {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  };

  const result = await runChain({ messages: body.messages, model: body.model }, env);
  if (!result.ok) {
    await licznikStore.append(
      makeReceipt({
        user_id: body.user_id,
        provider: '(chain-failed)',
        model: body.model ?? '',
        prompt_tokens: 0,
        completion_tokens: 0,
        cache_hit_tokens: 0,
        wholesale_usd: 0,
        margin_pct: marginPct,
        retail_usd: 0,
        profit_usd: 0,
        pricing_verified: false,
        attempts: result.attempts,
        fallback_used: false,
        ok: false,
        error: result.error,
      }),
    );
    return NextResponse.json({ ok: false, error: result.error, failures: result.failures }, { status: 502 });
  }

  const cost = computeWholesale(result.usage, result.provider, result.model);
  const totals = applyMargin(cost, marginPct);
  const receipt = makeReceipt({
    user_id: body.user_id,
    provider: result.provider,
    model: result.model,
    prompt_tokens: cost.input_tokens,
    completion_tokens: cost.output_tokens,
    cache_hit_tokens: cost.cache_hit_tokens,
    wholesale_usd: cost.wholesale_usd,
    margin_pct: totals.margin_pct,
    retail_usd: totals.retail_usd,
    profit_usd: totals.profit_usd,
    pricing_verified: cost.pricing_verified,
    attempts: result.attempts,
    fallback_used: result.fallback_used,
    ok: true,
  });
  await licznikStore.append(receipt);

  return NextResponse.json({
    ok: true,
    text: result.content,
    provider: result.provider,
    model: result.model,
    attempts: result.attempts,
    fallback_used: result.fallback_used,
    failures: result.failures,
    usage: {
      prompt_tokens: cost.input_tokens,
      completion_tokens: cost.output_tokens,
      cache_hit_tokens: cost.cache_hit_tokens,
    },
    cost: {
      wholesale_usd: cost.wholesale_usd,
      margin_pct: totals.margin_pct,
      retail_usd: totals.retail_usd,
      profit_usd: totals.profit_usd,
      pricing_verified: cost.pricing_verified,
    },
    receipt_id: receipt.id,
  });
}
