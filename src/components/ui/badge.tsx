import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
        success: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400',
        warning: 'bg-warning-100 text-warning-600 dark:bg-warning-500/20 dark:text-warning-400',
        danger: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
        secondary: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
        outline: 'border border-[var(--border-primary)] text-[var(--text-secondary)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
