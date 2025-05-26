'use client';

import {
  calculateFinalAmount,
  formatPrice,
  formatTokenAmount,
} from '@app/features/TokenSwap/moneyHelpers';
import { Iconify } from '@common/UI/iconify';
import { getTokenMeta, handleIconError } from '@features/TokenSwap/common';
import type { SwapFormData } from '@features/TokenSwap/index';
import { IconArrowRight } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { useFormContext } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { ActionIcon, Box, Card, Center, Group, Stack, Text } from '@mantine/core';
import { selectExchangeRate, selectSwapData } from '../swapSlice';
import sharedClasses from '@features/TokenSwap/css/Common.module.css';
import classes from '@features/TokenSwap/css/SuccessScreen.module.css';

interface SuccessScreenProps {
  transactionHash: string;
  fee: number;
  onReturnToMain: () => void;
}

export function SuccessScreen({ transactionHash, fee, onReturnToMain }: SuccessScreenProps) {
  // Get form data from context
  const { watch } = useFormContext<SwapFormData>();
  const formValues = watch();

  // Get calculated data from Redux instead of re-fetching
  const swapData = useSelector(selectSwapData);
  const exchangeRate = useSelector(selectExchangeRate);

  // Fallback to form values if swapData is not available
  const {
    sourceToken = formValues.sourceToken,
    targetToken = formValues.targetToken,
    sourceAmount = formValues.cryptoAmount,
    targetAmount = formValues.targetAmount,
  } = swapData || {};

  const finalReceiveAmount = calculateFinalAmount(targetAmount, fee);

  return (
    <Center className={classes.container}>
      <Card
        shadow="xl"
        radius="xl"
        p={0}
        classNames={{
          root: `${sharedClasses.card} ${classes.fadeIn}`,
        }}
      >
        <Stack gap={20} p="xl">
          {/* Success Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={classes.successSection}
          >
            {/* Success Check Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 15,
                delay: 0.2,
              }}
              className={classes.successAnimationContainer}
            >
              <Box className={classes.successCircle}>
                <Iconify
                  icon="heroicons:check-16-solid"
                  width={55}
                  className={classes.successIcon}
                />
              </Box>
            </motion.div>

            {/* Success Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Text size="xl" fw={700} c="dark.8" ta="center">
                Swap complete
              </Text>
            </motion.div>
          </motion.div>

          {/* Token Swap Visual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Box className={classes.swapVisual}>
              <div className={classes.swapContainer}>
                {/* Source Token */}
                <div className={classes.tokenSection}>
                  <Stack align="center" gap={12} className={classes.tokenInfo}>
                    {sourceToken && (
                      <img
                        src={getTokenMeta(sourceToken)?.icon}
                        alt={`${sourceToken} icon`}
                        width={48}
                        height={48}
                        className={classes.tokenIcon}
                        onError={handleIconError}
                      />
                    )}
                    <Text className={classes.tokenAmount}>
                      -{formatTokenAmount(sourceAmount)} {sourceToken}
                    </Text>
                  </Stack>
                </div>

                {/* Arrow */}
                <div className={classes.arrowSection}>
                  <IconArrowRight size={24} className={classes.arrowIcon} />
                </div>

                {/* Target Token */}
                <div className={classes.tokenSection}>
                  <Stack align="center" gap={12} className={classes.tokenInfo}>
                    {targetToken && (
                      <img
                        src={getTokenMeta(targetToken)?.icon}
                        alt={`${targetToken} icon`}
                        width={48}
                        height={48}
                        className={classes.tokenIcon}
                        onError={handleIconError}
                      />
                    )}
                    <Text className={classes.tokenAmountReceived}>
                      +{formatTokenAmount(finalReceiveAmount)} {targetToken}
                    </Text>
                  </Stack>
                </div>
              </div>
            </Box>
          </motion.div>

          {/* Transaction Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Box className={classes.detailsSection}>
              <Text className={classes.detailsHeader}>Transaction details</Text>

              <Stack gap={8}>
                <Group justify="space-between" className={classes.detailRow}>
                  <Text className={classes.detailLabel}>Transaction hash</Text>
                  <Group gap={4}>
                    <Text className={classes.detailValue}>
                      {transactionHash.slice(0, 6)}...{transactionHash.slice(-4)}
                    </Text>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <ActionIcon size="sm" variant="subtle" color="violet">
                        <Iconify icon="heroicons:clipboard" width={14} />
                      </ActionIcon>
                    </motion.div>
                  </Group>
                </Group>

                <Group justify="space-between" className={classes.detailRow}>
                  <Text className={classes.detailLabel}>Exchange rate</Text>
                  <Text className={classes.detailValue}>
                    1 {sourceToken} = {exchangeRate ? formatPrice(exchangeRate) : '...'}{' '}
                    {targetToken}
                  </Text>
                </Group>

                <Group justify="space-between" className={classes.detailRow}>
                  <Text className={classes.detailLabel}>Processing fee</Text>
                  <Text className={classes.detailValue}>
                    {formatTokenAmount(fee)} {targetToken}
                  </Text>
                </Group>

                <Group justify="space-between" className={classes.finalReceiveRow}>
                  <Text className={classes.finalReceiveLabel}>Final amount received</Text>
                  <Text className={classes.finalReceiveValue}>
                    {formatTokenAmount(finalReceiveAmount)} {targetToken}
                  </Text>
                </Group>
              </Stack>
            </Box>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{ marginTop: '10px' }}
          >
            <button
              onClick={onReturnToMain}
              className={classes.newSwapButton}
              onMouseEnter={(e) => {
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
                <Iconify icon="heroicons:arrow-path" width={20} />
                Make another swap
              </Group>
            </button>
          </motion.div>
        </Stack>
      </Card>
    </Center>
  );
}
