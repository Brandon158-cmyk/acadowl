import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ConvexClientProvider } from '@/providers/ConvexClientProvider';
import { SchoolProvider } from '@/providers/SchoolProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

/**
 * Custom render function that wraps the UI with all necessary providers.
 * Perfect for component tests that depend on context or Convex data.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ConvexClientProvider>
        <SchoolProvider slug="test-school">
          <ThemeProvider>{children}</ThemeProvider>
        </SchoolProvider>
      </ConvexClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
