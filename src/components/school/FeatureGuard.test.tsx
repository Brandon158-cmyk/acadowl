import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeatureGuard } from './FeatureGuard';
import { Feature } from '@/lib/features/flags';
import * as useFeatureModule from '@/hooks/useFeature';

// Mock the hook independently for testing logic
vi.mock('@/hooks/useFeature', () => ({
  useFeature: vi.fn(),
}));

describe('FeatureGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when the feature is enabled', () => {
    vi.spyOn(useFeatureModule, 'useFeature').mockReturnValue(true);

    render(
      <FeatureGuard feature={Feature.BOARDING}>
        <div data-testid="child-content">Visible content</div>
      </FeatureGuard>,
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders fallback (or null) when the feature is disabled', () => {
    vi.spyOn(useFeatureModule, 'useFeature').mockReturnValue(false);

    render(
      <FeatureGuard
        feature={Feature.BOARDING}
        fallback={<div data-testid="fallback">Fallback</div>}
      >
        <div data-testid="child-content">Hidden content</div>
      </FeatureGuard>,
    );

    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('does not render children when requires feature is enabled but primary feature is disabled', () => {
    // Mock the hook to return false for boarding, true for transport (just simulating dynamic calls)
    vi.spyOn(useFeatureModule, 'useFeature').mockImplementation((feat) => {
      if (feat === Feature.BOARDING) return false;
      if (feat === Feature.TRANSPORT) return true;
      return false;
    });

    render(
      <FeatureGuard
        feature={Feature.BOARDING}
        requires={Feature.TRANSPORT}
        fallback={<span data-testid="fallback" />}
      >
        <div data-testid="child-content">Content</div>
      </FeatureGuard>,
    );

    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('renders children only when both primary feature and requires feature are enabled', () => {
    vi.spyOn(useFeatureModule, 'useFeature').mockReturnValue(true);

    render(
      <FeatureGuard feature={Feature.BOARDING} requires={Feature.TRANSPORT}>
        <div data-testid="child-content">Visible content</div>
      </FeatureGuard>,
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});
