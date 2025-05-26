'use client';

import { useEffect, useRef } from 'react';
import { useSwapCalculation } from '@app/features/TokenSwap/hooks/useSwapCalculation';
import { useTokenPairData } from '@app/features/TokenSwap/hooks/useTokenData';
import { formatPrice, formatUSD } from '@app/features/TokenSwap/moneyHelpers';
import { IconAlertCircle } from '@tabler/icons-react';
import { useFormContext } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Box, Card, Center, Loader, Stack, Transition } from '@mantine/core';
import { getAvailableTokens, getTokenMeta } from '@features/TokenSwap/common';
import type { SwapFormData } from '@features/TokenSwap/index';
import {
  calculateTokenAmount,
  calculateUSDValue,
  getEffectiveTokenPrice,
} from '@features/TokenSwap/moneyHelpers';
import { initiateSwap, selectSwapError, selectSwapLoading } from '@features/TokenSwap/swapSlice';
import { AmountInputSection } from './AmountInputSection';
import { SwapHeader } from '@features/TokenSwap/components/StepOne/SwapHeader';
import { SwapResults } from '@features/TokenSwap/components/StepOne/SwapResults';
import { TokenSelectionSection } from '@features/TokenSwap/components/StepOne/TokenSelectionSection';
import sharedClasses from '@features/TokenSwap/css/Common.module.css';
import classes from '@features/TokenSwap/css/SwapInterface.module.css';

export function SwapInterface() {
  const dispatch = useDispatch();
  const prevInputModeRef = useRef<'crypto' | 'usd'>('crypto');

  // Only use Redux for global state (loading, errors, flow state)
  const loading = useSelector(selectSwapLoading);
  const error = useSelector(selectSwapError);

  // Use form context instead of useForm
  const {
    watch,
    setValue,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useFormContext<SwapFormData>();

  // Watch form values
  const sourceToken = watch('sourceToken');
  const targetToken = watch('targetToken');
  const inputMode = watch('inputMode');
  const cryptoAmount = watch('cryptoAmount');
  const usdAmount = watch('usdAmount');
  const targetAmount = watch('targetAmount');
  const lastChanged = watch('lastChanged');

  // Use simple RTK Query hooks for token data
  const {
    sourceInfo,
    targetInfo,
    sourcePrice,
    targetPrice,
    loading: tokenDataLoading,
    error: tokenDataError,
  } = useTokenPairData({
    sourceSymbol: sourceToken,
    targetSymbol: targetToken,
  });

  // Use simplified swap calculation hook
  const {
    exchangeRate,
    loading: calculationLoading,
    error: calculationError,
  } = useSwapCalculation({
    sourceInfo,
    targetInfo,
    sourcePrice,
    targetPrice,
    sourceAmount: cryptoAmount,
    targetAmount,
    lastChanged,
    onSourceAmountChange: (amount) => setValue('cryptoAmount', amount),
    onTargetAmountChange: (amount) => setValue('targetAmount', amount),
  });

  const isLoading = tokenDataLoading || calculationLoading || loading;
  const currentError = !isLoading ? tokenDataError || calculationError || error : null;

  // Handler functions
  const handleAmountChange = (values: any, field: any) => {
    field.onChange(values.value || '');
    setValue('lastChanged', 'source');
  };

  // Update USD amount when crypto amount or price changes
  useEffect(() => {
    if (cryptoAmount && inputMode === 'crypto' && sourceToken) {
      const effectivePrice = getEffectiveTokenPrice(sourceToken, sourcePrice);
      if (effectivePrice) {
        const usdValue = calculateUSDValue(Number(cryptoAmount), sourceToken, effectivePrice);
        setValue('usdAmount', usdValue.toString());
      }
    }
  }, [cryptoAmount, sourcePrice, sourceToken, inputMode, setValue]);

  // Update crypto amount when USD amount or price changes
  useEffect(() => {
    if (usdAmount && inputMode === 'usd' && sourceToken) {
      const effectivePrice = getEffectiveTokenPrice(sourceToken, sourcePrice);
      if (effectivePrice) {
        const cryptoValue = calculateTokenAmount(Number(usdAmount), sourceToken, effectivePrice);
        setValue('cryptoAmount', cryptoValue.toString());
      }
    }
  }, [usdAmount, sourcePrice, sourceToken, inputMode, setValue]);

  // Handle mode switching conversion
  useEffect(() => {
    if (sourceToken && prevInputModeRef.current !== inputMode) {
      const effectivePrice = getEffectiveTokenPrice(sourceToken, sourcePrice);
      if (effectivePrice) {
        if (inputMode === 'usd' && cryptoAmount) {
          // Switching from crypto to USD mode, convert crypto amount to USD
          const usdValue = calculateUSDValue(Number(cryptoAmount), sourceToken, effectivePrice);
          setValue('usdAmount', usdValue.toString());
        } else if (inputMode === 'crypto' && usdAmount) {
          // Switching from USD to crypto mode, convert USD amount to crypto
          const cryptoValue = calculateTokenAmount(Number(usdAmount), sourceToken, effectivePrice);
          setValue('cryptoAmount', cryptoValue.toString());
        }
      }
      prevInputModeRef.current = inputMode;
    }
  }, [inputMode, sourcePrice, sourceToken, cryptoAmount, usdAmount, setValue]);

  // Adjust amount when switching tokens if it exceeds new token's balance
  useEffect(() => {
    if (!sourceToken) return;

    const tokenMeta = getTokenMeta(sourceToken);
    if (!tokenMeta || tokenMeta.balance === undefined) return;

    const effectivePrice = getEffectiveTokenPrice(sourceToken, sourcePrice);
    if (!effectivePrice) return;

    const currentAmount = inputMode === 'crypto' ? cryptoAmount : usdAmount;
    if (!currentAmount) return;

    const numericValue = Number(currentAmount);
    if (isNaN(numericValue) || numericValue <= 0) return;

    if (inputMode === 'crypto') {
      // Check if crypto amount exceeds balance
      if (numericValue > tokenMeta.balance) {
        setValue('cryptoAmount', tokenMeta.balance.toString());
        setValue('lastChanged', 'source');
      }
    } else {
      // Check if USD amount exceeds balance
      const cryptoEquivalent = calculateTokenAmount(numericValue, sourceToken, effectivePrice);
      if (cryptoEquivalent > tokenMeta.balance) {
        const maxUsdValue = calculateUSDValue(tokenMeta.balance, sourceToken, effectivePrice);
        setValue('usdAmount', maxUsdValue.toString());
        setValue('lastChanged', 'source');
      }
    }
  }, [sourceToken, sourcePrice]);

  // Clear balance validation errors when relevant values change
  useEffect(() => {
    clearErrors(['cryptoAmount', 'usdAmount']);
  }, [cryptoAmount, usdAmount, inputMode, sourceToken, clearErrors]);

  // Token options
  const sourceOptions = getAvailableTokens(targetToken || undefined);
  const targetOptions = getAvailableTokens(sourceToken || undefined);

  // Handle form submission
  const onSubmit = (data: SwapFormData) => {
    // Custom balance validation on submit
    const validateBalance = () => {
      if (!data.sourceToken) return { isValid: true };

      const tokenMeta = getTokenMeta(data.sourceToken);
      if (!tokenMeta || tokenMeta.balance === undefined) return { isValid: true };

      const effectivePrice = getEffectiveTokenPrice(data.sourceToken, sourcePrice);
      if (!effectivePrice) return { isValid: true };

      const activeAmount = data.inputMode === 'crypto' ? data.cryptoAmount : data.usdAmount;
      if (!activeAmount) return { isValid: true };

      const numericValue = Number(activeAmount);
      if (isNaN(numericValue) || numericValue <= 0) return { isValid: true };

      if (data.inputMode === 'crypto') {
        // Direct validation for crypto mode
        if (numericValue > tokenMeta.balance) {
          return {
            isValid: false,
            error: `Insufficient balance. Available: ${formatPrice(tokenMeta.balance)} ${data.sourceToken}`,
          };
        }
      } else {
        // Convert USD to crypto for validation in USD mode
        const cryptoEquivalent = calculateTokenAmount(
          numericValue,
          data.sourceToken,
          effectivePrice
        );
        if (cryptoEquivalent > tokenMeta.balance) {
          const maxUsdValue = calculateUSDValue(
            tokenMeta.balance,
            data.sourceToken,
            effectivePrice
          );
          return {
            isValid: false,
            error: `Insufficient balance. Available: $${formatUSD(maxUsdValue)}`,
          };
        }
      }

      return { isValid: true };
    };

    const balanceValidation = validateBalance();

    if (!balanceValidation.isValid) {
      // Set a custom error on the appropriate field
      const fieldName = data.inputMode === 'crypto' ? 'cryptoAmount' : 'usdAmount';
      setError(fieldName, {
        type: 'manual',
        message: balanceValidation.error!,
      });
      return;
    }

    if (data.sourceToken && data.targetToken) {
      // Redux-based flow - dispatch action with calculated data
      if (sourceInfo && targetInfo && sourcePrice && targetPrice && exchangeRate) {
        dispatch(
          initiateSwap({
            sourceInfo,
            targetInfo,
            sourcePrice,
            targetPrice,
            exchangeRate,
            sourceAmount: data.cryptoAmount,
            targetAmount: data.targetAmount,
            sourceToken: data.sourceToken,
            targetToken: data.targetToken,
          })
        );
      }
    }
  };

  return (
    <Center className={`${sharedClasses.fullScreenContainer} ${classes.mainContainer}`}>
      <Card
        shadow="xl"
        radius="xl"
        p={{ base: 20, sm: 24, md: 32 }}
        classNames={{
          root: sharedClasses.cardAlternate,
        }}
        style={{ position: 'relative' }}
      >
        {/* Loading Overlay */}
        <Transition
          mounted={isLoading}
          transition={{
            in: { opacity: 1 },
            out: { opacity: 0 },
            transitionProperty: 'opacity',
          }}
          duration={200}
        >
          {(styles) => (
            <Box className={classes.loadingOverlay} style={styles}>
              <div className={classes.loadingContent}>
                <Loader size="lg" color="violet" />
              </div>
            </Box>
          )}
        </Transition>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap={20}>
            {/* Header */}
            <SwapHeader />

            {/* Error Alert */}
            <Transition mounted={!!currentError} transition="fade" duration={200}>
              {(styles) => (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="orange"
                  radius="lg"
                  className={classes.errorAlert}
                  style={styles}
                  classNames={{
                    icon: classes.errorAlertIcon,
                    message: classes.errorAlertMessage,
                  }}
                >
                  {currentError}
                </Alert>
              )}
            </Transition>

            {/* Token Selection */}
            <TokenSelectionSection
              sourcePrice={sourcePrice}
              targetPrice={targetPrice}
              sourceOptions={sourceOptions}
              targetOptions={targetOptions}
            />

            {/* Amount Input */}
            <AmountInputSection sourcePrice={sourcePrice} onAmountChange={handleAmountChange} />

            {/* Results Section */}
            <SwapResults
              targetAmount={targetAmount}
              sourcePrice={sourcePrice}
              targetPrice={targetPrice}
            />

            {/* Validation Errors */}
            {(errors.sourceToken ||
              errors.targetToken ||
              errors.cryptoAmount ||
              errors.usdAmount) && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="orange"
                radius="lg"
                className={classes.validationAlert}
                classNames={{
                  icon: classes.validationAlertIcon,
                  message: classes.validationAlertMessage,
                }}
              >
                {errors.sourceToken?.message ||
                  errors.targetToken?.message ||
                  errors.cryptoAmount?.message ||
                  errors.usdAmount?.message}
              </Alert>
            )}

            {/* Exchange Button */}
            <Box className={classes.submitContainer}>
              <button
                type="submit"
                disabled={!isValid || isLoading}
                className={`${classes.exchangeButtonNoTransform} ${classes.exchangeButton} ${
                  isLoading || !isValid ? classes.exchangeButtonDisabled : ''
                }`}
              >
                Continue
              </button>
            </Box>
          </Stack>
        </form>
      </Card>
    </Center>
  );
}
