import { getTokenMeta } from '@app/features/TokenSwap/common';
import type { TokenInfo } from '@app/features/TokenSwap/types';
import { NextRequest, NextResponse } from 'next/server';

// Prices are now fetched directly from CoinGecko in the browser (tokenApi.ts).
// This route only serves static token info (address, decimals, symbol, name).

function buildTokenInfo(symbol: string, chainId: string): TokenInfo | null {
  const meta = getTokenMeta(symbol);
  if (!meta || String(meta.chainId) !== String(chainId)) return null;
  return {
    address: meta.address,
    chain: meta.chainId,
    decimals: meta.decimals ?? 18,
    symbol: meta.symbol,
    name: meta.label,
  };
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, chainId, symbol } = body;

  if (type === 'info') {
    if (!chainId || !symbol) {
      return NextResponse.json({ error: 'Missing chainId or symbol' }, { status: 400 });
    }
    const data = buildTokenInfo(String(symbol), String(chainId));
    if (!data) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
