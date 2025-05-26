import { NextRequest, NextResponse } from 'next/server';
import { getAssetErc20ByChainAndSymbol, getAssetPriceInfo } from '@funkit/api-base';

// Simple API endpoint - RTK Query handles caching on the client side
export async function POST(req: NextRequest) {
  const apiKey = process.env.FUNKIT_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key missing' }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, chainId, symbol, assetTokenAddress, amount } = body;

  try {
    if (type === 'info') {
      if (!chainId || !symbol) {
        return NextResponse.json({ error: 'Missing chainId or symbol' }, { status: 400 });
      }

      const data = await getAssetErc20ByChainAndSymbol({
        chainId,
        symbol,
        apiKey,
      });

      return NextResponse.json(data);
    } else if (type === 'price') {
      if (!chainId || !assetTokenAddress) {
        return NextResponse.json(
          { error: 'Missing chainId or assetTokenAddress' },
          { status: 400 }
        );
      }

      const data = await getAssetPriceInfo({
        chainId,
        assetTokenAddress,
        apiKey,
      });

      return NextResponse.json(data);
    } else if (type === 'batch-prices') {
      // Handle batch price requests
      const { tokens } = body;
      if (!Array.isArray(tokens)) {
        return NextResponse.json({ error: 'tokens must be an array' }, { status: 400 });
      }

      const results = await Promise.allSettled(
        tokens.map(
          async (token: { chainId: string; assetTokenAddress: string; symbol: string }) => {
            const { chainId, assetTokenAddress, symbol } = token;

            const data = await getAssetPriceInfo({
              chainId,
              assetTokenAddress,
              apiKey,
            });

            return { symbol, chainId, data };
          }
        )
      );

      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map((result) => result.value);

      return NextResponse.json({ results: successfulResults });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json({ error: err?.message || 'API error' }, { status: 500 });
  }
}
