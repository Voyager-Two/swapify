import { TOKENS, getTokenMeta } from '@features/TokenSwap/common';
import { TokenInfo, TokenPrice } from '@features/TokenSwap/types';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// CoinGecko coin IDs for each token symbol.
// WBTC uses "bitcoin" since it's pegged 1:1 and more reliable on the free tier.
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  ETH: 'ethereum',
  WBTC: 'bitcoin',
  USDC: 'usd-coin',
  USDT: 'tether',
  UNI: 'uniswap',
  LINK: 'chainlink',
  AAVE: 'aave',
};

// All unique coin IDs we ever need — fetched in one request
const ALL_COIN_IDS = [...new Set(Object.values(SYMBOL_TO_COINGECKO_ID))];

export const tokenApi = createApi({
  reducerPath: 'tokenApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  keepUnusedDataFor: 60,
  tagTypes: ['TokenInfo', 'TokenPrice'],
  endpoints: (builder) => ({
    // Static token info (address, decimals) — served from our local route, no external call
    getTokenInfo: builder.query<TokenInfo, { symbol: string; chainId: string }>({
      query: ({ symbol, chainId }) => ({
        url: '/token-info',
        method: 'POST',
        body: { type: 'info', chainId, symbol },
      }),
      providesTags: (result, error, { symbol, chainId }) => [
        { type: 'TokenInfo', id: `${symbol}-${chainId}` },
      ],
    }),

    // ALL token prices in ONE CoinGecko request.
    // Using void args means every caller shares the same cache entry → exactly one request per 60s.
    getAllTokenPrices: builder.query<Record<string, TokenPrice>, void>({
      queryFn: async () => {
        try {
          const url = `${COINGECKO_BASE}/simple/price?ids=${ALL_COIN_IDS.map(encodeURIComponent).join(',')}&vs_currencies=usd`;
          const res = await fetch(url);
          if (!res.ok) {
            return { error: { status: res.status, error: `CoinGecko ${res.status}` } };
          }
          const data = (await res.json()) as Record<string, { usd?: number }>;
          const result: Record<string, TokenPrice> = {};
          for (const [symbol, coinId] of Object.entries(SYMBOL_TO_COINGECKO_ID)) {
            const usd = data[coinId]?.usd;
            if (typeof usd === 'number') {
              result[symbol] = { unitPrice: usd, currency: 'usd' };
            }
          }
          return { data: result };
        } catch (e) {
          return { error: { status: 'FETCH_ERROR', error: String(e) } };
        }
      },
      providesTags: [{ type: 'TokenPrice', id: 'ALL' }],
    }),

    // Convenience selector: single token price derived from the shared batch cache.
    // Still goes to the same CoinGecko URL so RTK Query deduplicates the in-flight request.
    getTokenPrice: builder.query<TokenPrice, { symbol: string; chainId: string; address: string }>({
      queryFn: async ({ symbol }) => {
        const coinId = SYMBOL_TO_COINGECKO_ID[symbol];
        if (!coinId) {
          return { error: { status: 'CUSTOM_ERROR', error: `No CoinGecko id for ${symbol}` } };
        }
        try {
          const url = `${COINGECKO_BASE}/simple/price?ids=${ALL_COIN_IDS.map(encodeURIComponent).join(',')}&vs_currencies=usd`;
          const res = await fetch(url);
          if (!res.ok) {
            return { error: { status: res.status, error: `CoinGecko ${res.status}` } };
          }
          const data = (await res.json()) as Record<string, { usd?: number }>;
          const usd = data[coinId]?.usd;
          if (typeof usd !== 'number') {
            return { error: { status: 'CUSTOM_ERROR', error: 'No price returned' } };
          }
          return { data: { unitPrice: usd, currency: 'usd' } };
        } catch (e) {
          return { error: { status: 'FETCH_ERROR', error: String(e) } };
        }
      },
      providesTags: (result, error, { symbol, chainId }) => [
        { type: 'TokenPrice', id: `${symbol}-${chainId}` },
      ],
    }),

    // Legacy batch query — kept for backward compatibility
    getMultipleTokenPrices: builder.query<
      { symbol: string; chainId: string; data: TokenPrice }[],
      string[]
    >({
      queryFn: async (symbols) => {
        try {
          const url = `${COINGECKO_BASE}/simple/price?ids=${ALL_COIN_IDS.map(encodeURIComponent).join(',')}&vs_currencies=usd`;
          const res = await fetch(url);
          if (!res.ok) {
            return { error: { status: res.status, error: `CoinGecko ${res.status}` } };
          }
          const data = (await res.json()) as Record<string, { usd?: number }>;
          const result = symbols.map((symbol) => {
            const meta = getTokenMeta(symbol);
            const coinId = SYMBOL_TO_COINGECKO_ID[symbol];
            const usd = coinId ? data[coinId]?.usd : undefined;
            return {
              symbol,
              chainId: meta?.chainId ?? '',
              data: { unitPrice: typeof usd === 'number' ? usd : 0, currency: 'usd' } as TokenPrice,
            };
          });
          return { data: result };
        } catch (e) {
          return { error: { status: 'FETCH_ERROR', error: String(e) } };
        }
      },
      providesTags: (result, error, symbols) =>
        symbols.map((symbol) => {
          const meta = getTokenMeta(symbol);
          return { type: 'TokenPrice' as const, id: `${symbol}-${meta?.chainId}` };
        }),
    }),
  }),
});

export const {
  useGetTokenInfoQuery,
  useGetAllTokenPricesQuery,
  useGetTokenPriceQuery,
  useGetMultipleTokenPricesQuery,
  useLazyGetTokenInfoQuery,
  useLazyGetTokenPriceQuery,
} = tokenApi;
