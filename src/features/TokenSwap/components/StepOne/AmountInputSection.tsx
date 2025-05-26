'use client';

import { formatPrice, formatUSD } from '@app/features/TokenSwap/moneyHelpers';
import { Controller, useFormContext } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import { Box, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { getTokenMeta } from '@features/TokenSwap/common';
import type { SwapFormData } from '@features/TokenSwap/index';
import {
  calculateTokenAmount,
  calculateUSDValue,
  getEffectiveTokenPrice,
} from '@features/TokenSwap/moneyHelpers';
import classes from '@features/TokenSwap/css/SwapInterface.module.css';

interface AmountInputSectionProps {
  sourcePrice: any;
  onAmountChange: (values: any, field: any) => void;
}

export function AmountInputSection({ sourcePrice, onAmountChange }: AmountInputSectionProps) {
  const { control, setValue, watch } = useFormContext<SwapFormData>();

  const sourceToken = watch('sourceToken');
  const inputMode = watch('inputMode');
  const cryptoAmount = watch('cryptoAmount');
  const usdAmount = watch('usdAmount');

  const displayAmount = inputMode === 'crypto' ? cryptoAmount : usdAmount;

  const handleMaxClick = () => {
    const meta = sourceToken ? getTokenMeta(sourceToken) : undefined;
    if (meta && meta.balance !== undefined) {
      if (inputMode === 'crypto') {
        setValue('cryptoAmount', meta.balance.toString());
        setValue('lastChanged', 'source');
      } else {
        const effectivePrice = getEffectiveTokenPrice(sourceToken, sourcePrice);
        if (effectivePrice) {
          const usdValue = calculateUSDValue(meta.balance, sourceToken, effectivePrice);
          setValue('usdAmount', usdValue.toString());
          setValue('lastChanged', 'source');
        }
      }
    }
  };

  return (
    <Box className={classes.amountContainer}>
      <Stack gap="md">
        {/* Header with controls */}
        <Group justify="space-between" align="center">
          <Text size="sm" fw={500} c="dimmed">
            Amount
          </Text>
          <Group gap="xs">
            {/* Input Mode Toggle */}
            <Controller
              name="inputMode"
              control={control}
              render={({ field }) => (
                <Group gap={2} className={classes.toggleContainer}>
                  <Button
                    variant={field.value === 'usd' ? 'filled' : 'subtle'}
                    color="violet"
                    size="xs"
                    radius="6px"
                    onClick={() => field.onChange('usd')}
                    className={classes.toggleButton}
                  >
                    USD
                  </Button>
                  <Button
                    variant={field.value === 'crypto' ? 'filled' : 'subtle'}
                    color="violet"
                    size="xs"
                    radius="6px"
                    onClick={() => field.onChange('crypto')}
                    className={classes.toggleButton}
                  >
                    {sourceToken || 'Token'}
                  </Button>
                </Group>
              )}
            />
          </Group>
        </Group>

        {/* Input Field */}
        <Box>
          <Controller
            name={inputMode === 'crypto' ? 'cryptoAmount' : 'usdAmount'}
            control={control}
            render={({ field }) => (
              <Group gap="sm" align="center" wrap="nowrap">
                {/* Currency Symbol */}
                {inputMode === 'usd' && <Text className={classes.usdSymbol}>$</Text>}

                {/* Number Input */}
                <NumericFormat
                  value={field.value || ''}
                  onValueChange={(values) => onAmountChange(values, field)}
                  placeholder="0.00"
                  thousandSeparator=","
                  decimalScale={inputMode === 'usd' ? 2 : 8}
                  allowNegative={false}
                  customInput={TextInput}
                  variant="unstyled"
                  inputMode="tel"
                  autoComplete="off"
                  className={classes.numberInput}
                  classNames={{
                    input: classes.numberInputField,
                  }}
                />

                {/* Max Button */}
                <Button
                  variant="light"
                  color="violet"
                  size="xs"
                  radius="md"
                  className={classes.maxButtonCustom}
                  onClick={handleMaxClick}
                  disabled={!sourceToken || !getTokenMeta(sourceToken)?.balance}
                >
                  Max
                </Button>
              </Group>
            )}
          />
        </Box>

        {/* USD equivalent display */}
        {displayAmount && sourceToken && (
          <Text size="sm" c="dimmed" className={classes.equivalentText}>
            {(() => {
              const effectivePrice = getEffectiveTokenPrice(sourceToken, sourcePrice);
              if (!effectivePrice) return '';

              if (inputMode === 'crypto') {
                const usdValue = calculateUSDValue(
                  Number(displayAmount),
                  sourceToken,
                  effectivePrice
                );
                return `≈ $${formatUSD(usdValue)}`;
              } else {
                const cryptoValue = calculateTokenAmount(
                  Number(displayAmount),
                  sourceToken,
                  effectivePrice
                );
                return `≈ ${formatPrice(cryptoValue)} ${sourceToken}`;
              }
            })()}
          </Text>
        )}
      </Stack>
    </Box>
  );
}
