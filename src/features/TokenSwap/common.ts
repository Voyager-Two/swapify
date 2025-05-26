import { Token } from './types';

// Utility function to get cryptocurrency icon path
export const getCryptoIconPath = (
  symbol: string,
  style: 'color' | 'black' | 'white' | 'icon' = 'color'
): string => {
  const normalizedSymbol = symbol.toLowerCase();
  return `/crypto-icons/${normalizedSymbol}.svg`;
};

// Utility function to get generic fallback icon
export const getGenericIconPath = (): string => {
  return `/crypto-icons/generic.svg`;
};

// Utility function to handle icon error fallback
export const handleIconError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.target as HTMLImageElement;
  target.src = getGenericIconPath();
  target.onerror = null; // Prevent infinite loop
};

// TODO: use API data instead of hardcoding chainId and address
export const TOKENS: Token[] = [
  {
    symbol: 'USDC',
    label: 'USD Coin',
    chainId: '1',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    icon: getCryptoIconPath('usdc'),
    balance: 126937.97,
  },
  {
    symbol: 'USDT',
    label: 'Tether',
    chainId: '137',
    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    icon: getCryptoIconPath('usdt'),
    balance: 50000.12,
  },
  {
    symbol: 'ETH',
    label: 'Ethereum',
    chainId: '8453',
    address: '0x0000000000000000000000000000000000000000', // Native ETH
    icon: getCryptoIconPath('eth'),
    balance: 42.1234,
  },
  {
    symbol: 'WBTC',
    label: 'Wrapped Bitcoin',
    chainId: '1',
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    icon: getCryptoIconPath('wbtc'),
    balance: 1.2345,
  },
  {
    symbol: 'UNI',
    label: 'Uniswap',
    chainId: '1',
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    icon: getCryptoIconPath('uni'),
    balance: 800.0,
  },
  {
    symbol: 'LINK',
    label: 'Chainlink',
    chainId: '1',
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    icon: getCryptoIconPath('link'),
    balance: 2500.5,
  },
  {
    symbol: 'AAVE',
    label: 'Aave',
    chainId: '1',
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    icon: getCryptoIconPath('aave'),
    balance: 120.0,
  },
];

export const getTokenMeta = (symbol: string): Token | undefined =>
  TOKENS.find((t) => t.symbol === symbol);

export const getTokenOptions = () => TOKENS.map((t) => ({ value: t.symbol, label: t.label }));

export const getAvailableTokens = (excludeSymbol?: string) =>
  TOKENS.filter((t) => t.symbol !== excludeSymbol).map((t) => ({
    value: t.symbol,
    label: t.label,
  }));
