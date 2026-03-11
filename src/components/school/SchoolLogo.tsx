import { Doc } from '../../../convex/_generated/dataModel';

/**
 * SchoolLogo component.
 * ISSUE-020 · Reads school branding.
 *
 * Shows branding.logoUrl image if set,
 * falls back to text: school shortName in a colored box.
 */

interface SchoolLogoProps {
  school: Doc<'schools'> | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { box: 'h-8 w-8 text-xs', img: 'h-8 w-8' },
  md: { box: 'h-10 w-10 text-sm', img: 'h-10 w-10' },
  lg: { box: 'h-14 w-14 text-lg', img: 'h-14 w-14' },
};

export function SchoolLogo({ school, size = 'md', className = '' }: SchoolLogoProps) {
  const s = sizeMap[size];

  if (!school) {
    return (
      <div
        className={`${s.box} flex items-center justify-center rounded-lg bg-neutral-200 font-bold text-neutral-500 ${className}`}
      >
        ?
      </div>
    );
  }

  if (school.branding.logoUrl) {
    return (
      <img
        src={school.branding.logoUrl}
        alt={`${school.shortName || school.name} logo`}
        className={`${s.img} rounded-lg object-contain ${className}`}
      />
    );
  }

  return (
    <div
      className={`${s.box} flex items-center justify-center rounded-lg font-bold text-white ${className}`}
      style={{ backgroundColor: school.branding.primaryColor || '#1a6b3c' }}
    >
      {(school.shortName || school.name.slice(0, 3)).toUpperCase()}
    </div>
  );
}
