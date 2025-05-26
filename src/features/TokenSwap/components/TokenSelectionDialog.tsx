import { formatPrice, formatUSD } from '@app/features/TokenSwap/moneyHelpers';
import { useGetTokenPriceQuery } from '@app/features/TokenSwap/tokenApi';
import { Iconify } from '@common/UI/iconify';
import { getTokenMeta, handleIconError } from '@features/TokenSwap/common';
import { skipToken } from '@reduxjs/toolkit/query';
import { Box, CloseButton, Group, Loader, Modal, ScrollArea, Stack, Text } from '@mantine/core';
import classes from '@features/TokenSwap/css/TokenSelectionDialog.module.css';

interface TokenSelectionDialogProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (token: string) => void;
  tokens: Array<{ value: string; label: string }>;
  title: string;
}

// Helper hook to get price for a single token
function useTokenPrice(symbol: string) {
  const tokenMeta = getTokenMeta(symbol);
  const tokenPriceParams = tokenMeta
    ? { symbol, chainId: tokenMeta.chainId, address: tokenMeta.address }
    : skipToken;

  return useGetTokenPriceQuery(tokenPriceParams);
}

export function TokenSelectionDialog({
  opened,
  onClose,
  onSelect,
  tokens,
  title,
}: TokenSelectionDialogProps) {
  // Fetch prices for all tokens using RTK Query
  const priceQueries = tokens.map((token) => useTokenPrice(token.value));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="md"
      radius="xl"
      centered
      withCloseButton={false}
      classNames={{
        overlay: classes.modalOverlay,
        content: classes.modalContent,
        header: classes.modalHeader,
        body: classes.modalBody,
      }}
    >
      {/* Custom Header */}
      <Box className={classes.header}>
        <div className={classes.headerContent}>
          <div className={classes.titleSection}>
            <div className={classes.titleRow}>
              <Text className={classes.title}>{title}</Text>
            </div>
          </div>
          <CloseButton onClick={onClose} className={classes.closeButton} size="md" />
        </div>
      </Box>

      {/* Content Section */}
      <Box className={classes.content}>
        <Box className={classes.scrollContainer}>
          <ScrollArea
            h={440}
            scrollbarSize={6}
            scrollHideDelay={500}
            className={classes.scrollArea}
          >
            <Stack gap={0} className={classes.tokenList}>
              {tokens.map((token, index) => {
                const priceQuery = priceQueries[index];
                const price = priceQuery.data;

                return (
                  <div key={token.value} className={classes.tokenItemWrapper}>
                    <Box
                      onClick={() => {
                        onSelect(token.value);
                        onClose();
                      }}
                      className={classes.tokenItem}
                    >
                      <div className={classes.tokenItemContent}>
                        {/* Token Icon */}
                        <Box className={classes.tokenIconContainer}>
                          <img
                            src={getTokenMeta(token.value)?.icon}
                            alt={`${token.value} icon`}
                            width={32}
                            height={32}
                            className={classes.tokenIcon}
                            onError={handleIconError}
                          />
                        </Box>

                        {/* Token Details */}
                        <Box className={classes.tokenDetails}>
                          <Text className={classes.tokenName}>{token.label}</Text>
                          <Text className={classes.tokenSymbol}>{token.value}</Text>
                        </Box>

                        {/* Balance Information */}
                        <Stack gap={0} className={classes.tokenBalance}>
                          {(() => {
                            const meta = getTokenMeta(token.value);

                            if (!meta || meta.balance === undefined) {
                              return (
                                <>
                                  <Text className={classes.balanceAmount}>$0.00</Text>
                                  <Text className={classes.balanceUsd}>0.00 {token.value}</Text>
                                </>
                              );
                            }

                            const usdValue = price ? meta.balance * price.unitPrice : null;

                            return (
                              <>
                                <Text className={classes.balanceAmount}>
                                  {priceQuery.isLoading ? (
                                    <span className={classes.loadingIndicator}>
                                      <Loader size={8} />
                                      <span>...</span>
                                    </span>
                                  ) : usdValue !== null ? (
                                    `$${formatUSD(usdValue)}`
                                  ) : (
                                    '$0.00'
                                  )}
                                </Text>
                                <Text className={classes.balanceUsd}>
                                  {meta.balance.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}{' '}
                                  {token.value}
                                </Text>
                              </>
                            );
                          })()}
                        </Stack>

                        {/* Chevron Icon */}
                        <Iconify
                          icon="heroicons:chevron-right"
                          width={16}
                          className={classes.chevronIcon}
                        />
                      </div>
                    </Box>
                  </div>
                );
              })}
            </Stack>
          </ScrollArea>

          {/* Bottom fade indicator */}
          <Box className={classes.bottomFadeIndicator} />
        </Box>
      </Box>
    </Modal>
  );
}
