'use client';

import { formatPrice } from '@app/features/TokenSwap/moneyHelpers';
import { Iconify } from '@common/UI/iconify';
import { useFormContext } from 'react-hook-form';
import { Box, Group, Text, Tooltip } from '@mantine/core';
import { getTokenMeta, handleIconError } from '@features/TokenSwap/common';
import type { SwapFormData } from '@features/TokenSwap/index';
import classes from '@features/TokenSwap/css/SwapInterface.module.css';

interface SwapResultsProps {
  targetAmount: string;
  sourcePrice: any;
  targetPrice: any;
}

export function SwapResults({ targetAmount, sourcePrice, targetPrice }: SwapResultsProps) {
  const { watch } = useFormContext<SwapFormData>();

  const sourceToken = watch('sourceToken');
  const targetToken = watch('targetToken');

  if (!targetAmount || !targetPrice || !sourcePrice || !sourceToken || !targetToken) {
    return null;
  }

  return (
    <>
      {/* Simple Divider */}
      <Box className={classes.divider} />

      {/* You'll receive section */}
      <Group justify="space-between" align="center">
        <Group gap="3" align="center">
          <Text size="sm" fw={500} c="dimmed">
            You'll receive
          </Text>
          <Tooltip
            label={`1 ${sourceToken} = ${formatPrice(sourcePrice.unitPrice / targetPrice.unitPrice)} ${targetToken}`}
            radius="md"
            position="top"
            withArrow
          >
            <Iconify icon="heroicons:information-circle" width={14} className={classes.infoIcon} />
          </Tooltip>
        </Group>

        <Group gap="xs" align="center">
          {targetToken && (
            <img
              src={getTokenMeta(targetToken)?.icon}
              alt={`${targetToken} icon`}
              width={20}
              height={20}
              className={classes.tokenIcon}
              onError={handleIconError}
            />
          )}
          <Text size="lg" fw={600} c="dark.8">
            {formatPrice(Number(targetAmount))} {targetToken}
          </Text>
        </Group>
      </Group>
    </>
  );
}
