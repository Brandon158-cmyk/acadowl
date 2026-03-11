'use client';

import { ReactNode } from 'react';
import { useFeature } from '@/hooks/useFeature';
import { Feature } from '@/lib/features/flags';

/**
 * ISSUE-025 · FeatureGuard React Component
 *
 * Wraps any UI element and only renders it if a specified feature is enabled.
 * Used throughout the codebase to gate modules, nav items, form fields, etc.
 *
 * @example
 * <FeatureGuard feature={Feature.BOARDING}>
 *   <BoardingNavItem />
 * </FeatureGuard>
 *
 * <FeatureGuard feature={Feature.TRANSPORT} fallback={<UpgradeBanner />}>
 *   <TransportDashboard />
 * </FeatureGuard>
 *
 * <FeatureGuard feature={Feature.GPS_TRACKING} requires={Feature.TRANSPORT}>
 *   <LiveMapWidget />
 * </FeatureGuard>
 */
interface FeatureGuardProps {
  /** The feature that must be enabled */
  feature: Feature;
  /** Optional parent feature that must also be enabled */
  requires?: Feature;
  /** Content to show if feature is disabled (default: null) */
  fallback?: ReactNode;
  /** Children to render when feature is enabled */
  children: ReactNode;
}

export function FeatureGuard({ feature, requires, fallback = null, children }: FeatureGuardProps) {
  const isEnabled = useFeature(feature);
  const parentEnabled = requires ? useFeature(requires) : true;

  if (!isEnabled || !parentEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
