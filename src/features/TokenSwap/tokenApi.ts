import { getTokenMeta } from '@features/TokenSwap/common';
import { TokenInfo, TokenPrice } from '@features/TokenSwap/types';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// RTK Query API slice for token data
export const tokenApi = createApi({
  reducerPath: 'tokenApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
  }),
  // Cache data for 60 seconds
  keepUnusedDataFor: 60,
  tagTypes: ['TokenInfo', 'TokenPrice'],
  endpoints: (builder) => ({
    // Get token info
    getTokenInfo: builder.query<TokenInfo, { symbol: string; chainId: string }>({
      query: ({ symbol, chainId }) => ({
        url: '/token-info',
        method: 'POST',
        body: {
          type: 'info',
          chainId,
          symbol,
        },
      }),
      providesTags: (result, error, { symbol, chainId }) => [
        { type: 'TokenInfo', id: `${symbol}-${chainId}` },
      ],
    }),

    // Get token price
    getTokenPrice: builder.query<TokenPrice, { symbol: string; chainId: string; address: string }>({
      query: ({ chainId, address }) => ({
        url: '/token-info',
        method: 'POST',
        body: {
          type: 'price',
          chainId,
          assetTokenAddress: address,
        },
      }),
      providesTags: (result, error, { symbol, chainId }) => [
        { type: 'TokenPrice', id: `${symbol}-${chainId}` },
      ],
    }),

    // Get multiple token prices at once
    getMultipleTokenPrices: builder.query<
      { symbol: string; chainId: string; data: TokenPrice }[],
      string[]
    >({
      query: (symbols) => {
        const tokens = symbols.map((symbol) => {
          const meta = getTokenMeta(symbol);
          if (!meta) throw new Error(`No metadata for ${symbol}`);
          return {
            chainId: meta.chainId,
            assetTokenAddress: meta.address,
            symbol,
          };
        });

        return {
          url: '/token-info',
          method: 'POST',
          body: {
            type: 'batch-prices',
            tokens,
          },
        };
      },
      transformResponse: (response: { results: any[] }) => response.results,
      providesTags: (result, error, symbols) =>
        symbols.map((symbol) => {
          const meta = getTokenMeta(symbol);
          return { type: 'TokenPrice' as const, id: `${symbol}-${meta?.chainId}` };
        }),
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetTokenInfoQuery,
  useGetTokenPriceQuery,
  useGetMultipleTokenPricesQuery,
  useLazyGetTokenInfoQuery,
  useLazyGetTokenPriceQuery,
} = tokenApi;
