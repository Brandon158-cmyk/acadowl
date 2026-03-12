import * as React from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'border-input file:text-foreground placeholder:text-muted-foreground h-10 w-full min-w-0 rounded-md border-[1.5px] bg-white px-3 py-2.5 text-[14px] text-[#111827] transition-all file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium hover:border-[#D1D5DB] focus-visible:border-[#2D8C3E] focus-visible:shadow-[0_0_0_3px_rgba(45,140,62,0.15)] focus-visible:ring-0 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF] aria-invalid:border-[#DC2626] aria-invalid:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
