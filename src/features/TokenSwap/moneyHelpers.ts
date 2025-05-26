import { formatUnits, parseUnits } from 'viem';
import {
  calculateExchangeRate,
  calculateFee as calculateFeeWei,
  calculateSwapOutput,
  calculateUSDValue as calculateUSDValueWei,
  createPrice,
  createTokenAmount,
  formatDisplayAmount,
  subtractFee,
} from './weiCalculations';

// Helper function to format price
export const formatPrice = (price: number): string => {
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(8);
};

// Re-export the robust formatting function from weiCalculations
export const formatTokenAmount = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount) || numAmount === 0) return '0';

  try {
    // Convert to TokenAmount for precision formatting
    const tokenAmount = createTokenAmount(numAmount.toString(), 18);
    return formatDisplayAmount(tokenAmount);
  } catch {
    // Fallback to basic formatting if conversion fails
    return numAmount.toString();
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

// Calculate fees with precise Wei-based arithmetic (wrapper for UI convenience)
export const calculateFee = (amount: string, price?: { unitPrice: number }): number => {
  if (!amount) return 0;

  try {
    const tokenAmount = createTokenAmount(amount, 18);
    const feeAmount = calculateFeeWei(tokenAmount, 10); // 10 basis points = 0.1%
    return Number(feeAmount.formatted);
  } catch {
    return 0;
  }
};

// Calculate final receive amount after fees with precision
export const calculateFinalAmount = (amount: string, fee: number): number => {
  if (!amount) return 0;

  try {
    const tokenAmount = createTokenAmount(amount, 18);
    const feeAmount = createTokenAmount(fee.toString(), 18);
    const finalAmount = subtractFee(tokenAmount, feeAmount);
    return Number(finalAmount.formatted);
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

// Utility function to calculate USD value for a token amount using Wei precision
export const calculateUSDValue = (
  amount: number,
  symbol: string,
  apiPrice?: { unitPrice: number }
): number => {
  if (!amount || amount === 0) return 0;

  const effectivePrice = getEffectiveTokenPrice(symbol, apiPrice);
  if (!effectivePrice) return 0;

  try {
    const tokenAmount = createTokenAmount(amount.toString(), 18);
    const price = createPrice(effectivePrice.unitPrice);
    const usdValue = calculateUSDValueWei(tokenAmount, price);
    return Number(usdValue);
  } catch {
    return 0;
  }
};

// Utility function to calculate token amount from USD value using Wei precision
export const calculateTokenAmount = (
  usdAmount: number,
  symbol: string,
  apiPrice?: { unitPrice: number }
): number => {
  if (!usdAmount || usdAmount === 0) return 0;

  const effectivePrice = getEffectiveTokenPrice(symbol, apiPrice);
  if (!effectivePrice || effectivePrice.unitPrice <= 0) return 0;

  try {
    // For stablecoins, it's a 1:1 ratio
    if (isStablecoin(symbol)) {
      return usdAmount;
    }

    // Use Wei-based calculation: USD / USD_price_of_token = token_amount
    const usdAmountWei = createTokenAmount(usdAmount.toString(), 18);
    const tokenPriceWei = createPrice(effectivePrice.unitPrice);
    const usdPrice = createPrice(1.0); // $1 USD

    const exchangeRate = calculateExchangeRate(usdPrice, tokenPriceWei);
    const tokenResult = calculateSwapOutput(usdAmountWei, exchangeRate, 18);

    return Number(tokenResult.formatted);
  } catch {
    return 0;
  }
};
