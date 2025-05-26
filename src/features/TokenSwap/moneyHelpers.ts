import { formatUnits, parseUnits } from 'viem';
import { getTokenMeta } from './common';

// Helper function to format price
export const formatPrice = (price: number): string => {
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(8);
};

// Helper function to format token amounts with proper decimal handling
export const formatTokenAmount = (amount: string | number, decimals: number = 18): string => {
  try {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount) || numAmount === 0) return '0';

    // Convert to wei-like units and back for proper formatting
    const parsedAmount = parseUnits(numAmount.toString(), decimals);
    const formatted = formatUnits(parsedAmount, decimals);
    const num = parseFloat(formatted);

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
  } catch {
    return amount.toString();
  }
};

// Helper function to format USD amounts with comma separators
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to format price with comma separators (for large amounts)
export const formatPriceWithCommas = (price: number): string => {
  if (price >= 1) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }
  if (price >= 0.01) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(price);
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  }).format(price);
};

// Fee calculation with proper decimal handling
export const calculateFee = (amount: string, price?: { unitPrice: number }): number => {
  if (!amount) return 0;

  try {
    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount)) return 0;

    return numAmount * 0.001; // 0.1% fee
  } catch {
    return 0;
  }
};

// Final amount calculation after fees with proper decimal handling
export const calculateFinalAmount = (amount: string, fee: number): number => {
  if (!amount) return 0;

  try {
    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount)) return 0;

    return numAmount - fee;
  } catch {
    return 0;
  }
};

// Utility function to check if a token is a stablecoin that should be treated as $1
export const isStablecoin = (symbol: string): boolean => {
  return symbol === 'USDC' || symbol === 'USDT';
};

// Utility function to get the effective price for a token
// For stablecoins (USDC, USDT), returns exactly $1
// For other tokens, returns the API price if available
export const getEffectiveTokenPrice = (symbol: string, apiPrice?: { unitPrice: number }) => {
  if (isStablecoin(symbol)) {
    return { unitPrice: 1.0 };
  }
  return apiPrice;
};

// USD value calculation with proper decimal handling
export const calculateUSDValue = (
  amount: number,
  symbol: string,
  apiPrice?: { unitPrice: number }
): number => {
  if (!amount || amount === 0) return 0;

  const effectivePrice = getEffectiveTokenPrice(symbol, apiPrice);
  if (!effectivePrice) return 0;

  try {
    const tokenMeta = getTokenMeta(symbol);
    const decimals = tokenMeta?.decimals ?? 18;

    // Convert to wei-like units for precision
    const amountWei = parseUnits(amount.toString(), decimals);
    const priceWei = parseUnits(effectivePrice.unitPrice.toString(), 8); // 8 decimals for USD

    // Calculate USD value: (amount * price) / 10^decimals
    const usdValueWei = (amountWei * priceWei) / parseUnits('1', decimals);

    // Format back to readable number
    const usdValue = formatUnits(usdValueWei, 8);
    return parseFloat(usdValue);
  } catch {
    // Fallback to simple calculation
    return amount * effectivePrice.unitPrice;
  }
};

// Token amount calculation from USD value with proper decimal handling
export const calculateTokenAmount = (
  usdAmount: number,
  symbol: string,
  apiPrice?: { unitPrice: number }
): number => {
  if (!usdAmount || usdAmount === 0) return 0;

  const effectivePrice = getEffectiveTokenPrice(symbol, apiPrice);
  if (!effectivePrice || effectivePrice.unitPrice <= 0) return 0;

  try {
    const tokenMeta = getTokenMeta(symbol);
    const decimals = tokenMeta?.decimals ?? 18;

    // Convert to wei-like units for precision
    const usdWei = parseUnits(usdAmount.toString(), 8); // 8 decimals for USD
    const priceWei = parseUnits(effectivePrice.unitPrice.toString(), 8);

    // Calculate token amount: (usdAmount * 10^decimals) / price
    const tokenAmountWei = (usdWei * parseUnits('1', decimals)) / priceWei;

    // Format back to readable number
    const tokenAmount = formatUnits(tokenAmountWei, decimals);
    return parseFloat(tokenAmount);
  } catch {
    // Fallback to simple calculation
    return usdAmount / effectivePrice.unitPrice;
  }
};
