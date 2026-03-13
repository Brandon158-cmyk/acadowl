'use client';

import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding font-semibold font-sans whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-[#2D9B4E] text-white shadow-sm hover:bg-[#217A3C] hover:shadow-[0_4px_12px_rgba(45,155,78,0.25)] active:bg-[#1A6130] focus-visible:ring-[#2D9B4E]/40 focus-visible:ring-offset-2 disabled:bg-[#C3E6CF] disabled:text-white disabled:shadow-none dark:hover:bg-[#217A3C]',
        outline:
          'border-2 border-[#2D9B4E] bg-white text-[#2D9B4E] shadow-sm hover:bg-[#E8F5ED] hover:border-[#217A3C] hover:text-[#217A3C] active:bg-[#C3E6CF] active:translate-y-[1px] focus-visible:ring-[#2D9B4E]/40 focus-visible:ring-offset-2 disabled:bg-white disabled:border-[#E5E7EB] disabled:text-[#9CA3AF] dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        secondary:
          'border-2 border-[#2D9B4E] bg-white text-[#2D9B4E] shadow-sm hover:bg-[#E8F5ED] hover:border-[#217A3C] hover:text-[#217A3C] active:bg-[#C3E6CF] active:translate-y-[1px] focus-visible:ring-[#2D9B4E]/40 focus-visible:ring-offset-2 disabled:bg-white disabled:border-[#E5E7EB] disabled:text-[#9CA3AF]',
        ghost:
          'bg-transparent text-[#374151] border-1.5 border-[#E5E7EB] hover:bg-[#F3F4F6] hover:border-[#D1D5DB] active:bg-[#E5E7EB] focus-visible:ring-[#2D9B4E]/40 disabled:text-[#9CA3AF] disabled:border-[#E5E7EB] dark:hover:bg-muted/50 dark:text-muted-foreground',
        destructive:
          'bg-[#DC2626] text-white shadow-sm hover:bg-[#B91C1C] hover:shadow-[0_4px_8px_rgba(220,38,38,0.28)] active:bg-[#991B1B]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 text-[14px]',
        modal: 'h-9 px-4 text-[13px]',
        xs: 'h-6 px-2 text-[12px]',
        sm: 'h-8 px-[14px] text-[13px]',
        lg: 'h-12 px-6 text-[16px]',
        xl: 'h-14 px-8 text-[18px]',
        icon: 'size-10',
        'icon-xs': 'size-6',
        'icon-sm': 'size-8',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
