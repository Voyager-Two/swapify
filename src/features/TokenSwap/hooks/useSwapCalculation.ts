'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { TokenInfo, TokenPrice } from '@features/TokenSwap/types';
import { useDebouncedValue } from '@mantine/hooks';
import { getEffectiveTokenPrice } from '../moneyHelpers';
import {
  calculateExchangeRate,
  calculateSwapInput,
  calculateSwapOutput,
  createPrice,
  createTokenAmount,
  isZero,
} from '../weiCalculations';

interface UseSimpleSwapCalculationProps {
  sourceInfo: TokenInfo | undefined;
  targetInfo: TokenInfo | undefined;
  sourcePrice: TokenPrice | undefined;
  targetPrice: TokenPrice | undefined;
  sourceAmount: string;
  targetAmount: string;
  lastChanged: 'source' | 'target';
  onSourceAmountChange: (amount: string) => void;
  onTargetAmountChange: (amount: string) => void;
}

interface UseSimpleSwapCalculationReturn {
  exchangeRate: number | null;
  loading: boolean;
  error: string | null;
}

export function useSwapCalculation({
  sourceInfo,
  targetInfo,
  sourcePrice,
  targetPrice,
  sourceAmount,
  targetAmount,
  lastChanged,
  onSourceAmountChange,
  onTargetAmountChange,
}: UseSimpleSwapCalculationProps): UseSimpleSwapCalculationReturn {
  // Debounced values for calculations (600ms for smooth UX)
  const [debouncedSourceAmount] = useDebouncedValue(sourceAmount, 600);
  const [debouncedTargetAmount] = useDebouncedValue(targetAmount, 600);

  // Calculate exchange rate using wei-based precision
  const { exchangeRate, exchangeRateBig } = useMemo(() => {
    if (!sourceInfo || !targetInfo) return { exchangeRate: null, exchangeRateBig: null };

    // Get effective prices for both tokens (handles stablecoins)
    const effectiveSourcePrice = getEffectiveTokenPrice(sourceInfo.symbol, sourcePrice);
    const effectiveTargetPrice = getEffectiveTokenPrice(targetInfo.symbol, targetPrice);

    if (
      !effectiveSourcePrice ||
      !effectiveTargetPrice ||
      effectiveSourcePrice.unitPrice === 0 ||
      effectiveTargetPrice.unitPrice === 0
    ) {
      return { exchangeRate: null, exchangeRateBig: null };
    }

    try {
      const sourcePriceWei = createPrice(effectiveSourcePrice.unitPrice);
      const targetPriceWei = createPrice(effectiveTargetPrice.unitPrice);
      const rateBig = calculateExchangeRate(sourcePriceWei, targetPriceWei);

      // Convert to display rate (floating point for UI only)
      const displayRate = Number(rateBig) / Number(BigInt('1000000000000000000')); // 10^18

      return {
        exchangeRate: displayRate,
        exchangeRateBig: rateBig,
      };
    } catch {
      return { exchangeRate: null, exchangeRateBig: null };
    }
  }, [sourceInfo, targetInfo, sourcePrice?.unitPrice, targetPrice?.unitPrice]);

  // Calculate target amount from source amount with precision
  const calculateTargetFromSource = useCallback(
    (srcAmount: string): string => {
      if (
        !sourceInfo ||
        !targetInfo ||
        !exchangeRateBig ||
        !srcAmount ||
        isNaN(Number(srcAmount))
      ) {
        return '';
      }

      try {
        const sourceTokenAmt = createTokenAmount(srcAmount, sourceInfo.decimals ?? 18);
        if (isZero(sourceTokenAmt)) return '';

        const targetTokenAmt = calculateSwapOutput(
          sourceTokenAmt,
          exchangeRateBig,
          targetInfo.decimals ?? 18
        );

        return targetTokenAmt.formatted;
      } catch {
        return '';
      }
    },
    [sourceInfo, targetInfo, exchangeRateBig]
  );

  // Calculate source amount from target amount with precision
  const calculateSourceFromTarget = useCallback(
    (tgtAmount: string): string => {
      if (
        !sourceInfo ||
        !targetInfo ||
        !exchangeRateBig ||
        !tgtAmount ||
        isNaN(Number(tgtAmount))
      ) {
        return '';
      }

      try {
        const targetTokenAmt = createTokenAmount(tgtAmount, targetInfo.decimals ?? 18);
        if (isZero(targetTokenAmt)) return '';

        const sourceTokenAmt = calculateSwapInput(
          targetTokenAmt,
          exchangeRateBig,
          sourceInfo.decimals ?? 18
        );

        return sourceTokenAmt.formatted;
      } catch {
        return '';
      }
    },
    [sourceInfo, targetInfo, exchangeRateBig]
  );

  // Update amounts when debounced values change
  useEffect(() => {
    if (lastChanged === 'source' && debouncedSourceAmount && exchangeRateBig) {
      const newTargetAmount = calculateTargetFromSource(debouncedSourceAmount);
      if (newTargetAmount !== targetAmount) {
        onTargetAmountChange(newTargetAmount);
      }
    }
  }, [
    debouncedSourceAmount,
    lastChanged,
    exchangeRateBig,
    calculateTargetFromSource,
    targetAmount,
    onTargetAmountChange,
  ]);

  useEffect(() => {
    if (lastChanged === 'target' && debouncedTargetAmount && exchangeRateBig) {
      const newSourceAmount = calculateSourceFromTarget(debouncedTargetAmount);
      if (newSourceAmount !== sourceAmount) {
        onSourceAmountChange(newSourceAmount);
      }
    }
  }, [
    debouncedTargetAmount,
    lastChanged,
    exchangeRateBig,
    calculateSourceFromTarget,
    sourceAmount,
    onSourceAmountChange,
  ]);

  // Determine loading and error states
  const loading = useMemo(() => {
    if (!sourceInfo || !targetInfo) return true;

    // Check if we have effective prices for both tokens
    const effectiveSourcePrice = getEffectiveTokenPrice(sourceInfo.symbol, sourcePrice);
    const effectiveTargetPrice = getEffectiveTokenPrice(targetInfo.symbol, targetPrice);

    return !effectiveSourcePrice || !effectiveTargetPrice;
  }, [sourceInfo, targetInfo, sourcePrice, targetPrice]);

  const error = useMemo(() => {
    // Only show errors when we're not loading and there's an actual problem
    if (loading) return null;

    if (!sourceInfo || !targetInfo) return 'Token information not available';

    const effectiveSourcePrice = getEffectiveTokenPrice(sourceInfo.symbol, sourcePrice);
    const effectiveTargetPrice = getEffectiveTokenPrice(targetInfo.symbol, targetPrice);

    if (!effectiveSourcePrice || !effectiveTargetPrice) return 'Price information not available';
    if (exchangeRate === null) return 'Unable to calculate exchange rate';
    return null;
  }, [sourceInfo, targetInfo, sourcePrice, targetPrice, exchangeRate, loading]);

  return {
    exchangeRate,
    loading,
    error,
  };
}
