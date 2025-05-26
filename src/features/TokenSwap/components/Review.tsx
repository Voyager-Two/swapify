'use client';

import {
  calculateFinalAmount,
  formatPrice,
  formatTokenAmount,
  formatUSD,
} from '@app/features/TokenSwap/moneyHelpers';
import { Iconify } from '@common/UI/iconify';
import { getTokenMeta, handleIconError } from '@features/TokenSwap/common';
import type { SwapFormData } from '@features/TokenSwap/index';
import { calculateUSDValue, getEffectiveTokenPrice } from '@features/TokenSwap/moneyHelpers';
import {
  selectExchangeRate,
  selectSourcePrice,
  selectSwapData,
  selectTargetPrice,
} from '@features/TokenSwap/swapSlice';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useFormContext } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { ActionIcon, Box, Card, Center, Group, Loader, Stack, Text } from '@mantine/core';
import classes from '@features/TokenSwap/css/ReviewScreen.module.css';

interface ReviewScreenProps {
  fee: number;
  onBack: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ReviewScreen({ fee, onBack, onConfirm, isLoading = false }: ReviewScreenProps) {
  // Get form data from context
  const { watch } = useFormContext<SwapFormData>();
  const formValues = watch();

  // Get calculated data from Redux instead of re-fetching
  const swapData = useSelector(selectSwapData);
  const exchangeRate = useSelector(selectExchangeRate);
  const sourcePrice = useSelector(selectSourcePrice);

  // Fallback to form values if swapData is not available
  const {
    sourceToken = formValues.sourceToken,
    targetToken = formValues.targetToken,
    sourceAmount = formValues.cryptoAmount,
    targetAmount = formValues.targetAmount,
  } = swapData || {};

  const finalReceiveAmount = calculateFinalAmount(targetAmount, fee);

  // Calculate USD value using effective pricing (handles stablecoins)
  const sourceUsdValue =
    sourceToken && sourcePrice
      ? calculateUSDValue(
          parseFloat(sourceAmount),
          sourceToken,
          getEffectiveTokenPrice(sourceToken, sourcePrice)
        )
      : 0;

  return (
    <Center className={classes.container}>
      <Card shadow="xl" radius="xl" p={0} className={`${classes.card} ${classes.fadeIn}`}>
        {/* Header */}
        <Box p="lg" className={classes.header}>
          <Group justify="space-between" align="center">
            <ActionIcon variant="subtle" size="lg" onClick={onBack} className={classes.backButton}>
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Text size="lg" fw={700} c="dark.8">
              Review Swap
            </Text>
            <Box className={classes.spacer} />
          </Group>
        </Box>

        <Stack gap={20} p="xl">
          {/* Token Swap Visual */}
          <Box className={classes.swapVisual}>
            <div className={classes.swapContainer}>
              {/* Source Token */}
              <div className={classes.tokenSection}>
                <Stack align="center" gap={12} className={classes.tokenInfo}>
                  {sourceToken && (
                    <img
                      src={getTokenMeta(sourceToken)?.icon}
                      alt={`${sourceToken} icon`}
                      width={64}
                      height={64}
                      className={classes.tokenIcon}
                      onError={handleIconError}
                    />
                  )}
                  <Text className={classes.tokenAmount}>
                    {formatTokenAmount(sourceAmount)} {sourceToken}
                  </Text>
                </Stack>
              </div>

              {/* Arrow - Centered */}
              <div className={classes.arrowSection}>
                <IconArrowRight size={28} className={classes.arrowIcon} />
              </div>

              {/* Target Token */}
              <div className={classes.tokenSection}>
                <Stack align="center" gap={12} className={classes.tokenInfo}>
                  {targetToken && (
                    <img
                      src={getTokenMeta(targetToken)?.icon}
                      alt={`${targetToken} icon`}
                      width={64}
                      height={64}
                      className={classes.tokenIcon}
                      onError={handleIconError}
                    />
                  )}
                  <Text className={classes.tokenAmount}>
                    {formatTokenAmount(finalReceiveAmount)} {targetToken}
                  </Text>
                </Stack>
              </div>
            </div>
          </Box>

          {/* Transaction Details */}
          <Box className={`${classes.detailsSection} ${classes.slideIn}`}>
            <Text className={classes.detailsHeader}>Transaction details</Text>

            {/* USD Amount */}
            <Group justify="space-between" align="center" className={classes.detailRow}>
              <Text className={classes.detailLabel}>USD amount</Text>
              <Text className={classes.detailValue}>${formatUSD(sourceUsdValue)}</Text>
            </Group>

            {/* Exchange Rate */}
            <Group justify="space-between" align="center" className={classes.detailRow}>
              <Text className={classes.detailLabel}>Rate</Text>
              <Text className={classes.detailValue}>
                1 {sourceToken} = {formatPrice(exchangeRate || 0)} {targetToken}
              </Text>
            </Group>

            {/* Processing Fee */}
            <Group justify="space-between" align="center" className={classes.detailRow}>
              <Text className={classes.detailLabel}>Processing fee</Text>
              <Text className={classes.detailValue}>
                {formatTokenAmount(fee)} {targetToken}
              </Text>
            </Group>

            {/* Final Amount - Highlighted */}
            <Group justify="space-between" align="center" className={classes.finalReceiveRow}>
              <Text className={classes.finalReceiveLabel}>You receive</Text>
              <Text className={classes.finalReceiveValue}>
                {formatTokenAmount(finalReceiveAmount)} {targetToken}
              </Text>
            </Group>
          </Box>

          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={classes.confirmButton}
            onMouseEnter={(e) => {
              if (isLoading) return;
              // Create glare element with CSS classes
              const glare = document.createElement('div');
              glare.className = classes.glareEffect;
              e.currentTarget.appendChild(glare);

              // Trigger animation
              requestAnimationFrame(() => {
                glare.classList.add(classes.glareActive);
              });

              // Remove glare after animation
              setTimeout(() => {
                if (glare.parentNode) glare.parentNode.removeChild(glare);
              }, 1200);
            }}
          >
            <Group gap="sm" justify="center" align="center">
              {isLoading ? (
                <>
                  <Loader size="sm" color="white" />
                  Processing...
                </>
              ) : (
                <>
                  <Iconify icon="heroicons:check-circle" width={20} />
                  Confirm Swap
                </>
              )}
            </Group>
          </button>
        </Stack>
      </Card>
    </Center>
  );
}
