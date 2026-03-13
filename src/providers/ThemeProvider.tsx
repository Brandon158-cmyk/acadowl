'use client';

import { useEffect, type ReactNode } from 'react';
import { useSchool } from '@/hooks/useSchool';

/**
 * ISSUE-020 · ThemeProvider for School Branding
 *
 * Reads school.branding from useSchool() and injects CSS variables
 * on document.documentElement. The entire UI adapts to the school's colors.
 */

function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Determine if white text is readable on the given background color.
 * WCAG AA requires a contrast ratio of at least 4.5:1 for normal text.
 */
function needsDarkText(hex: string): boolean {
  const hsl = hexToHSL(hex);
  if (!hsl) return false;
  return hsl.l > 55;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { branding, isLoading } = useSchool();

  useEffect(() => {
    if (isLoading || !branding) return;

    const root = document.documentElement;
    const primary = branding.primaryColor || '#2D9B4E';
    const secondary = branding.secondaryColor || '#E5A100';

    // Set hex values
    root.style.setProperty('--school-primary', primary);
    root.style.setProperty('--school-secondary', secondary);

    // Parse to HSL for Tailwind compatibility
    const primaryHSL = hexToHSL(primary);
    if (primaryHSL) {
      root.style.setProperty('--school-primary-h', String(primaryHSL.h));
      root.style.setProperty('--school-primary-s', `${primaryHSL.s}%`);
      root.style.setProperty('--school-primary-l', `${primaryHSL.l}%`);
    }

    const secondaryHSL = hexToHSL(secondary);
    if (secondaryHSL) {
      root.style.setProperty('--school-secondary-h', String(secondaryHSL.h));
      root.style.setProperty('--school-secondary-s', `${secondaryHSL.s}%`);
      root.style.setProperty('--school-secondary-l', `${secondaryHSL.l}%`);
    }

    // WCAG contrast check
    root.style.setProperty(
      '--school-primary-foreground',
      needsDarkText(primary) ? '#1a1a1a' : '#ffffff',
    );
  }, [branding, isLoading]);

  return <>{children}</>;
}
