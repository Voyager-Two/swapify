import { formatUnits, parseUnits } from 'viem';

/**
 * Wei-based calculation utilities for crypto tokens
 * Works with smallest units to avoid floating point precision issues
 * Similar to how Uniswap and other DeFi protocols handle calculations
 */

export interface TokenAmount {
  /** Amount in smallest units (wei equivalent) */
  raw: bigint;
  /** Token decimals */
  decimals: number;
  /** Human readable amount (for display only) */
  formatted: string;
}

export interface Price {
  /** Price in USD with 8 decimal precision (like CoinGecko API) */
  usdPrice: bigint;
}

// Use 8 decimals for USD price precision (standard for most APIs)
const USD_DECIMALS = 8;
const USD_MULTIPLIER = parseUnits('1', USD_DECIMALS);

/**
 * Create TokenAmount from human-readable string
 */
export function createTokenAmount(amount: string, decimals: number): TokenAmount {
  const raw = parseUnits(amount, decimals);
  return {
    raw,
    decimals,
    formatted: formatUnits(raw, decimals),
  };
}

/**
 * Create Price from USD price number (from API)
 */
export function createPrice(usdPrice: number): Price {
  return {
    usdPrice: parseUnits(usdPrice.toString(), USD_DECIMALS),
  };
}

/**
 * Calculate exact exchange rate between two tokens using their USD prices
 * Returns rate with high precision (18 decimals)
 */
export function calculateExchangeRate(sourcePrice: Price, targetPrice: Price): bigint {
  // Rate = sourcePrice / targetPrice
  // Use 18 decimal precision for the rate
  const RATE_PRECISION = 18;
  const ratePrecisionMultiplier = parseUnits('1', RATE_PRECISION);

  return (sourcePrice.usdPrice * ratePrecisionMultiplier) / targetPrice.usdPrice;
}

/**
 * Swap calculation: convert source token amount to target token amount
 */
export function calculateSwapOutput(
  sourceAmount: TokenAmount,
  exchangeRate: bigint,
  targetDecimals: number
): TokenAmount {
  // Normalize source amount to 18 decimals for calculation
  const sourceNormalized =
    sourceAmount.decimals <= 18
      ? sourceAmount.raw * parseUnits('1', 18 - sourceAmount.decimals)
      : sourceAmount.raw / parseUnits('1', sourceAmount.decimals - 18);

  // Apply exchange rate (rate has 18 decimals)
  const targetNormalized = (sourceNormalized * exchangeRate) / parseUnits('1', 18);

  // Convert to target token decimals
  const targetRaw =
    targetDecimals <= 18
      ? targetNormalized / parseUnits('1', 18 - targetDecimals)
      : targetNormalized * parseUnits('1', targetDecimals - 18);

  return {
    raw: targetRaw,
    decimals: targetDecimals,
    formatted: formatUnits(targetRaw, targetDecimals),
  };
}

/**
 * Reverse swap calculation: convert target token amount to source token amount
 */
export function calculateSwapInput(
  targetAmount: TokenAmount,
  exchangeRate: bigint,
  sourceDecimals: number
): TokenAmount {
  // Normalize target amount to 18 decimals
  const targetNormalized =
    targetAmount.decimals <= 18
      ? targetAmount.raw * parseUnits('1', 18 - targetAmount.decimals)
      : targetAmount.raw / parseUnits('1', targetAmount.decimals - 18);

  // Reverse the exchange rate calculation
  const sourceNormalized = (targetNormalized * parseUnits('1', 18)) / exchangeRate;

  // Convert to source token decimals
  const sourceRaw =
    sourceDecimals <= 18
      ? sourceNormalized / parseUnits('1', 18 - sourceDecimals)
      : sourceNormalized * parseUnits('1', sourceDecimals - 18);

  return {
    raw: sourceRaw,
    decimals: sourceDecimals,
    formatted: formatUnits(sourceRaw, sourceDecimals),
  };
}

/**
 * Calculate USD value of a token amount
 */
export function calculateUSDValue(amount: TokenAmount, price: Price): string {
  // Normalize amount to 18 decimals
  const amountNormalized =
    amount.decimals <= 18
      ? amount.raw * parseUnits('1', 18 - amount.decimals)
      : amount.raw / parseUnits('1', amount.decimals - 18);

  // Price has 8 decimals, so result has 18 + 8 = 26 decimals
  // We want 2 decimal USD result, so divide by 10^24
  const usdValueRaw = (amountNormalized * price.usdPrice) / parseUnits('1', 24);

  return formatUnits(usdValueRaw, 2);
}

/**
 * Calculate fee amount (in same token)
 */
export function calculateFee(amount: TokenAmount, feeBasisPoints: number): TokenAmount {
  // Basis points: 1 bp = 0.01%, so 100 bp = 1%
  const feeMultiplier = parseUnits((feeBasisPoints / 10000).toString(), 18);
  const feeRaw = (amount.raw * feeMultiplier) / parseUnits('1', 18);

  return {
    raw: feeRaw,
    decimals: amount.decimals,
    formatted: formatUnits(feeRaw, amount.decimals),
  };
}

/**
 * Subtract fee from amount
 */
export function subtractFee(amount: TokenAmount, fee: TokenAmount): TokenAmount {
  const resultRaw = amount.raw - fee.raw;

  return {
    raw: resultRaw,
    decimals: amount.decimals,
    formatted: formatUnits(resultRaw, amount.decimals),
  };
}

/**
 * Check if amount is zero
 */
export function isZero(amount: TokenAmount): boolean {
  return amount.raw === BigInt(0);
}

/**
 * Compare two token amounts
 */
export function compareAmounts(a: TokenAmount, b: TokenAmount): number {
  if (a.raw < b.raw) return -1;
  if (a.raw > b.raw) return 1;
  return 0;
}

/**
 * Format amount for display with appropriate precision
 */
export function formatDisplayAmount(amount: TokenAmount): string {
  const num = Number(amount.formatted);

  if (num === 0) return '0';
  if (num >= 1000000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(num);
  }
  if (num >= 1) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    }).format(num);
  }
  if (num >= 0.000001) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    }).format(num);
  }

  return num.toExponential(4);
}
