import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
  testId?: string;
}

export function Tooltip({ label, children, side = 'top', testId }: TooltipProps) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        data-testid={testId}
        className={cn(
          'pointer-events-none absolute start-1/2 z-[80] w-max max-w-48 -translate-x-1/2 whitespace-normal rounded-md bg-slate-900 px-2 py-1 text-center text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover/tt:opacity-100 group-focus-within/tt:opacity-100 dark:bg-slate-700',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
        )}
      >
        {label}
      </span>
    </span>
  );
}