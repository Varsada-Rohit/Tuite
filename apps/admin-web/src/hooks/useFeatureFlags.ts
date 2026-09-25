'use client';

import { useCallback } from 'react';
import type { FeatureName } from '@tuite/shared-types';
import { useAuth } from '@/lib/auth-context';

/**
 * Hook for checking tenant feature flags in the UI.
 * Components use this to conditionally render tabs/buttons for modules
 * that the Super Admin has toggled on/off.
 *
 * @example
 *   const { hasFeature } = useFeatureFlags();
 *   if (hasFeature('VIDEO_LECTURES')) { ... }
 */
export function useFeatureFlags() {
  const { user } = useAuth();
  const features = user?.features ?? [];

  const hasFeature = useCallback(
    (name: FeatureName): boolean => {
      return features.includes(name);
    },
    [features],
  );

  return { features, hasFeature };
}
