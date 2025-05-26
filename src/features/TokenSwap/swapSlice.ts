import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SwapData, SwapFlow, SwapState, Token, TokenInfo, TokenPrice } from './types';

interface SwapSliceState {
  // Flow state
  showReview: boolean;
  showSuccess: boolean;
  transactionHash: string;

  // API state
  loading: boolean;
  error: string | null;

  // Additional global state
  availableTokens: Token[];
  fee: number;

  // Calculated swap data
  swapData: {
    sourceInfo: TokenInfo | null;
    targetInfo: TokenInfo | null;
    sourcePrice: TokenPrice | null;
    targetPrice: TokenPrice | null;
    exchangeRate: number | null;
    sourceAmount: string;
    targetAmount: string;
    sourceToken: string;
    targetToken: string;
  } | null;
}

const initialState: SwapSliceState = {
  // Flow state
  showReview: false,
  showSuccess: false,
  transactionHash: '',

  // API state
  loading: false,
  error: null,

  // Additional state
  availableTokens: [],
  fee: 0,

  // Calculated swap data
  swapData: null,
};

const swapSlice = createSlice({
  name: 'swap',
  initialState,
  selectors: {
    // Flow state
    selectShowReview: (state) => state.showReview,
    selectShowSuccess: (state) => state.showSuccess,
    selectTransactionHash: (state) => state.transactionHash,

    // API state
    selectSwapLoading: (state) => state.loading,
    selectSwapError: (state) => state.error,

    // Additional state
    selectAvailableTokens: (state) => state.availableTokens,
    selectFee: (state) => state.fee,

    // Swap data selectors
    selectSwapData: (state) => state.swapData,
    selectExchangeRate: (state) => state.swapData?.exchangeRate,
    selectSourceInfo: (state) => state.swapData?.sourceInfo,
    selectTargetInfo: (state) => state.swapData?.targetInfo,
    selectSourcePrice: (state) => state.swapData?.sourcePrice,
    selectTargetPrice: (state) => state.swapData?.targetPrice,

    // Computed selectors
    selectSwapFlow: (state) => ({
      showReview: state.showReview,
      showSuccess: state.showSuccess,
      transactionHash: state.transactionHash,
    }),
  },
  reducers: {
    // Flow management
    setShowReview: (state, action: PayloadAction<boolean>) => {
      state.showReview = action.payload;
    },
    setShowSuccess: (state, action: PayloadAction<boolean>) => {
      state.showSuccess = action.payload;
    },
    setTransactionHash: (state, action: PayloadAction<string>) => {
      state.transactionHash = action.payload;
    },

    // API state
    setSwapLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setSwapError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Additional state
    setFee: (state, action: PayloadAction<number>) => {
      state.fee = action.payload;
    },
    setAvailableTokens: (state, action: PayloadAction<Token[]>) => {
      state.availableTokens = action.payload;
    },

    // Set calculated swap data
    setSwapData: (state, action: PayloadAction<SwapSliceState['swapData']>) => {
      state.swapData = action.payload;
    },

    // Complex actions
    initiateSwap: (
      state,
      action: PayloadAction<{
        sourceInfo: TokenInfo;
        targetInfo: TokenInfo;
        sourcePrice: TokenPrice;
        targetPrice: TokenPrice;
        exchangeRate: number;
        sourceAmount: string;
        targetAmount: string;
        sourceToken: string;
        targetToken: string;
      }>
    ) => {
      state.showReview = true;
      state.swapData = action.payload;
    },

    confirmSwap: (state) => {
      state.loading = true;
      state.error = null;
    },

    completeSwap: (state, action: PayloadAction<{ transactionHash: string }>) => {
      state.loading = false;
      state.showReview = false;
      state.showSuccess = true;
      state.transactionHash = action.payload.transactionHash;
    },

    failSwap: (state, action: PayloadAction<{ error: string }>) => {
      state.loading = false;
      state.error = action.payload.error;
    },

    resetSwapFlow: (state) => {
      state.showReview = false;
      state.showSuccess = false;
      state.transactionHash = '';
      state.error = null;
      state.loading = false;
    },

    resetSwap: (state) => {
      // Reset everything to initial state except available tokens
      const tokens = state.availableTokens;
      Object.assign(state, initialState);
      state.availableTokens = tokens;
    },
  },
});

export const {
  // Flow management
  setShowReview,
  setShowSuccess,
  setTransactionHash,

  // API state
  setSwapLoading,
  setSwapError,

  // Additional state
  setFee,
  setAvailableTokens,

  // Set calculated swap data
  setSwapData,

  // Complex actions
  initiateSwap,
  confirmSwap,
  completeSwap,
  failSwap,
  resetSwapFlow,
  resetSwap,
} = swapSlice.actions;

export const {
  // Flow state
  selectShowReview,
  selectShowSuccess,
  selectTransactionHash,

  // API state
  selectSwapLoading,
  selectSwapError,

  // Additional state
  selectAvailableTokens,
  selectFee,

  // Swap data selectors
  selectSwapData,
  selectExchangeRate,
  selectSourceInfo,
  selectTargetInfo,
  selectSourcePrice,
  selectTargetPrice,

  // Computed selectors
  selectSwapFlow,
} = swapSlice.selectors;

export default swapSlice.reducer;
