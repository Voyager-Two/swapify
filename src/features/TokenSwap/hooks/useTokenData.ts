'use client';

import { useMemo } from 'react';
import { useGetTokenInfoQuery, useGetTokenPriceQuery } from '@app/features/TokenSwap/tokenApi';
import { getTokenMeta } from '@features/TokenSwap/common';
import { TokenInfo, TokenPrice } from '@features/TokenSwap/types';
import { skipToken } from '@reduxjs/toolkit/query';

interface UseTokenDataProps {
  symbol: string | null;
}

interface UseTokenDataReturn {
  tokenInfo: TokenInfo | undefined;
  tokenPrice: TokenPrice | undefined;
  loading: boolean;
  error: string | null;
}

export function useTokenData({ symbol }: UseTokenDataProps): UseTokenDataReturn {
  const tokenMeta = useMemo(() => {
    return symbol ? getTokenMeta(symbol) : null;
  }, [symbol]);

  // Skip queries if no symbol or metadata
  const tokenInfoParams =
    tokenMeta && symbol ? { symbol: symbol as string, chainId: tokenMeta.chainId } : skipToken;

  const tokenPriceParams =
    tokenMeta && symbol
      ? { symbol: symbol as string, chainId: tokenMeta.chainId, address: tokenMeta.address }
      : skipToken;

  // Use RTK Query hooks - they handle caching automatically
  const {
    data: tokenInfo,
    isLoading: infoLoading,
    error: infoError,
  } = useGetTokenInfoQuery(tokenInfoParams);

  const {
    data: tokenPrice,
    isLoading: priceLoading,
    error: priceError,
  } = useGetTokenPriceQuery(tokenPriceParams);

  return {
    tokenInfo,
    tokenPrice,
    loading: infoLoading || priceLoading,
    error:
      // Only show errors when we're not loading and there's an actual problem
      infoLoading || priceLoading
        ? null
        : (infoError as any)?.message || (priceError as any)?.message || null,
  };
}

interface UseTokenPairDataProps {
  sourceSymbol: string | null;
  targetSymbol: string | null;
}

interface UseTokenPairDataReturn {
  sourceInfo: TokenInfo | undefined;
  targetInfo: TokenInfo | undefined;
  sourcePrice: TokenPrice | undefined;
  targetPrice: TokenPrice | undefined;
  loading: boolean;
  error: string | null;
}

export function useTokenPairData({
  sourceSymbol,
  targetSymbol,
}: UseTokenPairDataProps): UseTokenPairDataReturn {
  const sourceData = useTokenData({ symbol: sourceSymbol });
  const targetData = useTokenData({ symbol: targetSymbol });

  return {
    sourceInfo: sourceData.tokenInfo,
    targetInfo: targetData.tokenInfo,
    sourcePrice: sourceData.tokenPrice,
    targetPrice: targetData.tokenPrice,
    loading: sourceData.loading || targetData.loading,
    error: sourceData.error || targetData.error,
  };
}
