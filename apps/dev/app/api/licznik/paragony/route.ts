/**
 * GET /api/licznik/paragony — księga paragonów + suma marży.
 * Tylko do odczytu; auth jak w POST /api/licznik/chat.
 */
import { NextRequest, NextResponse } from 'next/server';
import { licznikStore } from '../../../../lib/licznik-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const adminToken = process.env.LICZNIK_ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: 'LICZNIK nieaktywny: LICZNIK_ADMIN_TOKEN nie skonfigurowany' }, { status: 503 });
  }
  if (req.headers.get('x-licznik-token') !== adminToken) {
    return NextResponse.json({ error: 'nieautoryzowane' }, { status: 401 });
  }

  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '100');
  const all = await licznikStore.list();
  const summary = await licznikStore.summary();
  // najnowsze najpierw
  const receipts = all.reverse().slice(0, Math.max(1, Math.min(limit, 1000)));
  return NextResponse.json({ summary, receipts });
}
