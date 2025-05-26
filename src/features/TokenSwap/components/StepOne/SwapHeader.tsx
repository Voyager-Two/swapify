'use client';

import { Iconify } from '@common/UI/iconify';
import { Box, Group, Stack, Text } from '@mantine/core';
import classes from '@features/TokenSwap/css/SwapInterface.module.css';

export function SwapHeader() {
  return (
    <Stack justify="center" align="center" gap="xs" mb={16}>
      {/* Logo and Brand Name */}
      <Group gap="sm" align="center">
        <Box className={classes.logoBox}>
          <Iconify
            icon="heroicons:arrow-path-rounded-square"
            width={20}
            className={classes.logoIcon}
          />
        </Box>
        <Text size="lg" fw={800} c="dark.8">
          Swapify
        </Text>
      </Group>

      {/* Slogan on its own row */}
      <Text size="xs" c="dimmed">
        Exchange tokens effortlessly
      </Text>
    </Stack>
  );
}
