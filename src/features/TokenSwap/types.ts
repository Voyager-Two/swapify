export interface Token {
  symbol: string;
  label: string;
  chainId: string;
  address: string;
  icon: string;
  balance?: number;
  decimals?: number;
}

export interface TokenInfo {
  address: string;
  chain: string;
  decimals: number;
  symbol: string;
  name?: string;
}

export interface TokenPrice {
  unitPrice: number;
  totalValue?: number;
  currency?: string;
}

export interface SwapState {
  sourceToken: string | null;
  targetToken: string | null;
  sourceAmount: string;
  targetAmount: string;
  lastChanged: 'source' | 'target';
}

export interface SwapFlow {
  showReview: boolean;
  showSwapLoading: boolean;
  showSuccess: boolean;
  transactionHash: string;
}

export interface SwapData {
  sourceInfo: TokenInfo | null;
  targetInfo: TokenInfo | null;
  sourcePrice: TokenPrice | null;
  targetPrice: TokenPrice | null;
  loading: boolean;
  error: string | null;
}
