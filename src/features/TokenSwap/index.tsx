'use client';

import { ReviewScreen } from '@app/features/TokenSwap/components/Review';
import { SwapInterface } from '@app/features/TokenSwap/components/StepOne/SwapInterface';
import { SuccessScreen } from '@app/features/TokenSwap/components/Success';
import { calculateFee } from '@app/features/TokenSwap/moneyHelpers';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';
import {
  completeSwap,
  confirmSwap,
  failSwap,
  resetSwapFlow,
  selectShowReview,
  selectShowSuccess,
  selectSwapLoading,
  selectTargetPrice,
  selectTransactionHash,
  setShowReview,
} from './swapSlice';

// Zod schema for form validation
const swapFormSchema = z
  .object({
    sourceToken: z.string().min(1, 'Please select a source token'),
    targetToken: z.string().min(1, 'Please select a target token'),
    inputMode: z.enum(['crypto', 'usd']),
    cryptoAmount: z.string(),
    usdAmount: z.string(),
    targetAmount: z.string().min(0),
    lastChanged: z.enum(['source', 'target']),
  })
  .refine(
    (data) => {
      return data.sourceToken !== data.targetToken;
    },
    {
      message: 'Source and target tokens must be different',
      path: ['targetToken'], // Show error on target token field
    }
  )
  .refine(
    (data) => {
      // Validate the active input field based on inputMode
      const activeAmount = data.inputMode === 'crypto' ? data.cryptoAmount : data.usdAmount;
      if (!activeAmount || activeAmount.trim() === '') {
        return false;
      }
      const num = parseFloat(activeAmount);
      return !isNaN(num) && num > 0;
    },
    {
      message: 'Please enter a valid amount greater than 0',
      path: ['cryptoAmount'], // Show error on the input field
    }
  );

export type SwapFormData = z.infer<typeof swapFormSchema>;

export default function MainView() {
  const dispatch = useDispatch();

  // Redux selectors
  const showReview = useSelector(selectShowReview);
  const showSuccess = useSelector(selectShowSuccess);
  const isLoading = useSelector(selectSwapLoading);
  const transactionHash = useSelector(selectTransactionHash);
  const targetPrice = useSelector(selectTargetPrice);

  // Form state at the top level
  const form = useForm<SwapFormData>({
    resolver: zodResolver(swapFormSchema),
    defaultValues: {
      sourceToken: 'ETH',
      targetToken: 'WBTC',
      inputMode: 'usd',
      cryptoAmount: '',
      usdAmount: '10000',
      targetAmount: '',
      lastChanged: 'source',
    },
    mode: 'onChange',
  });

  const formValues = form.watch();

  // Calculate fee based on form values and prices from Redux state
  const fee = calculateFee(formValues.targetAmount, targetPrice || undefined);

  // Handle swap confirmation - replace useSwapFlow with direct Redux actions
  const handleConfirmSwap = () => {
    dispatch(confirmSwap());

    // Simulate swap process
    setTimeout(() => {
      const mockTransactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      dispatch(completeSwap({ transactionHash: mockTransactionHash }));
    }, 2000);
  };

  // Handle returning to main from review screen
  const handleBackToMain = () => {
    dispatch(setShowReview(false));
  };

  // Handle returning to main from success screen
  const handleReturnToMainFromSuccess = () => {
    dispatch(resetSwapFlow());
  };

  // Render appropriate screen based on current state
  return (
    <FormProvider {...form}>
      {showSuccess ? (
        <SuccessScreen
          transactionHash={transactionHash}
          fee={fee}
          onReturnToMain={handleReturnToMainFromSuccess}
        />
      ) : showReview ? (
        <ReviewScreen
          fee={fee}
          onBack={handleBackToMain}
          onConfirm={handleConfirmSwap}
          isLoading={isLoading}
        />
      ) : (
        <SwapInterface />
      )}
    </FormProvider>
  );
}
