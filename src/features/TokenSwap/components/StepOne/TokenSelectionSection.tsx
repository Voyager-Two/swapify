'use client';

import { useState } from 'react';
import { formatUSD } from '@app/features/TokenSwap/moneyHelpers';
import { Iconify } from '@common/UI/iconify';
import { Controller, useFormContext } from 'react-hook-form';
import { ActionIcon, Box, Stack, Text, Transition } from '@mantine/core';
import { getTokenMeta, handleIconError } from '@features/TokenSwap/common';
import type { SwapFormData } from '@features/TokenSwap/index';
import { calculateUSDValue, getEffectiveTokenPrice, isStablecoin } from '@features/TokenSwap/moneyHelpers';
import { TokenSelectionDialog } from '@features/TokenSwap/components/TokenSelectionDialog';
import classes from '@features/TokenSwap/css/SwapInterface.module.css';

interface TokenSelectionSectionProps {
  sourcePrice: any;
  targetPrice: any;
  sourceOptions: any[];
  targetOptions: any[];
}

export function TokenSelectionSection({
  sourcePrice,
  targetPrice,
  sourceOptions,
  targetOptions,
}: TokenSelectionSectionProps) {
  const [selecting, setSelecting] = useState<'source' | 'target' | 'hover' | null>(null);
  const { control, setValue, watch } = useFormContext<SwapFormData>();

  const sourceToken = watch('sourceToken');
  const targetToken = watch('targetToken');

  const handleSwap = () => {
    setValue('sourceToken', targetToken);
    setValue('targetToken', sourceToken);
  };

  const renderTokenBalance = (token: string | null, price: any) => {
    const meta = token ? getTokenMeta(token) : undefined;
    if (!meta || meta.balance === undefined) return '$0.00';

    if (isStablecoin(meta.symbol)) {
      return `$${formatUSD(meta.balance)}`;
    } else {
      const effectivePrice = getEffectiveTokenPrice(meta.symbol, price);
      if (effectivePrice) {
        const usdValue = calculateUSDValue(meta.balance, meta.symbol, effectivePrice);
        return `$${formatUSD(usdValue)}`;
      } else {
        return '...';
      }
    }
  };

  return (
    <Box
      className={classes.tokenSelectionContainer}
      onMouseEnter={() => {
        if (selecting !== 'source' && selecting !== 'target') {
          setSelecting('hover');
        }
      }}
      onMouseLeave={() => {
        if (selecting === 'hover') {
          setSelecting(null);
        }
      }}
    >
      <Box className={classes.tokenSelectionCard}>
        <Stack gap="xs">
          {/* From Token */}
          <Box
            role="button"
            tabIndex={0}
            onClick={() => setSelecting('source')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setSelecting('source');
            }}
            className={`${classes.clickableBox} ${classes.tokenSelectionBox} ${
              selecting === 'source' ? classes.tokenSelectionBoxSelected : ''
            }`}
          >
            <div className={classes.tokenContainer}>
              <div className={classes.tokenInfo}>
                {sourceToken && (
                  <img
                    src={getTokenMeta(sourceToken)?.icon}
                    alt={`${sourceToken} icon`}
                    width={32}
                    height={32}
                    className={classes.tokenIcon}
                    onError={handleIconError}
                  />
                )}
                <Stack gap={0}>
                  <Text size="xs" fw={500} c="dimmed">
                    From
                  </Text>
                  <Text size="sm" fw={600} c="dark.8">
                    {sourceToken ? getTokenMeta(sourceToken)?.label || sourceToken : 'Select token'}
                  </Text>
                </Stack>
              </div>
              <div className={classes.tokenBalance}>
                <Stack gap={0} align="flex-end">
                  <Text size="sm" c="dark.5">
                    {renderTokenBalance(sourceToken, sourcePrice)}
                  </Text>
                  <Text size="xs" c="dark.3" fw={400}>
                    Available
                  </Text>
                </Stack>
                <Iconify icon="heroicons:chevron-down" width={16} className={classes.chevronIcon} />
              </div>
            </div>
          </Box>

          {/* To Token */}
          <Box
            role="button"
            tabIndex={0}
            onClick={() => setSelecting('target')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setSelecting('target');
            }}
            className={`${classes.clickableBox} ${classes.tokenSelectionBox} ${
              selecting === 'target' ? classes.tokenSelectionBoxSelected : ''
            }`}
          >
            <div className={classes.tokenContainer}>
              <div className={classes.tokenInfo}>
                {targetToken && (
                  <img
                    src={getTokenMeta(targetToken)?.icon}
                    alt={`${targetToken} icon`}
                    width={32}
                    height={32}
                    className={classes.tokenIcon}
                    onError={handleIconError}
                  />
                )}
                <Stack gap={0}>
                  <Text size="xs" fw={500} c="dimmed">
                    To
                  </Text>
                  <Text size="sm" fw={600} c="dark.8">
                    {targetToken ? getTokenMeta(targetToken)?.label || targetToken : 'Select token'}
                  </Text>
                </Stack>
              </div>
              <div className={classes.tokenBalance}>
                <Stack gap={0} align="flex-end">
                  <Text size="sm" c="dark.5">
                    {renderTokenBalance(targetToken, targetPrice)}
                  </Text>
                  <Text size="xs" c="dark.3" fw={400}>
                    Available
                  </Text>
                </Stack>
                <Iconify icon="heroicons:chevron-down" width={16} className={classes.chevronIcon} />
              </div>
            </div>
          </Box>
        </Stack>
      </Box>

      {/* Hover-activated Swap Button */}
      <Transition
        mounted={selecting === 'hover'}
        transition={{
          in: { opacity: 1, transform: 'translateY(-50%) scale(1)' },
          out: { opacity: 0, transform: 'translateY(-50%) scale(0.8)' },
          transitionProperty: 'opacity, transform',
        }}
        duration={200}
      >
        {(styles) => (
          <Box className={classes.swapButtonContainer} style={styles}>
            <ActionIcon
              variant="light"
              color="gray"
              size="md"
              radius="xl"
              onClick={handleSwap}
              className={classes.swapButton}
              title="Switch tokens"
            >
              <Iconify icon="heroicons:arrows-up-down-16-solid" width={16} />
            </ActionIcon>
          </Box>
        )}
      </Transition>

      {/* Token Selection Dialogs */}
      <Controller
        name="sourceToken"
        control={control}
        render={({ field }) => (
          <TokenSelectionDialog
            opened={selecting === 'source'}
            onClose={() => setSelecting(null)}
            onSelect={(token) => {
              field.onChange(token);
              setSelecting(null);
            }}
            tokens={sourceOptions}
            title="Select source token"
          />
        )}
      />

      <Controller
        name="targetToken"
        control={control}
        render={({ field }) => (
          <TokenSelectionDialog
            opened={selecting === 'target'}
            onClose={() => setSelecting(null)}
            onSelect={(token) => {
              field.onChange(token);
              setSelecting(null);
            }}
            tokens={targetOptions}
            title="Select target token"
          />
        )}
      />
    </Box>
  );
}
