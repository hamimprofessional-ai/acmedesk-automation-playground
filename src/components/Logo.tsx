import { useId } from 'react';
import { cn } from '@/lib/cn';

interface LogoProps {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}

export function Logo({ className, markClassName, wordmarkClassName }: LogoProps) {
  const gradientId = `acme-logo-${useId().replace(/[:]/g, '')}`;

  return (
    <span className={cn('group/logo flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'relative grid h-8 w-8 place-items-center transition-transform duration-300 group-hover/logo:scale-105 motion-reduce:transition-none',
          markClassName,
        )}
      >
        <span className="absolute inset-1 animate-logo-glow rounded-full bg-brand-500/40 blur-md motion-reduce:animate-none" />
        <svg
          viewBox="0 0 24 24"
          className="relative h-7 w-7 animate-logo-mark motion-reduce:animate-none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="2" y1="2" x2="21" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#818cf8" />
              <stop offset="0.55" stopColor="#6366f1" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <path
            d="M7 3h10a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-6.5L7 20.5V17a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z"
            fill={`url(#${gradientId})`}
          />
          <path
            d="M8.4 9.9 10.9 12.4 15.7 7.4"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            className="animate-logo-twinkle [transform-box:fill-box] [transform-origin:center] motion-reduce:animate-none"
            cx="18"
            cy="6.5"
            r="1.4"
            fill="#fff"
          />
        </svg>
      </span>
      <span className={cn('text-lg font-semibold leading-none tracking-tight', wordmarkClassName)}>
        <span className="animate-logo-text bg-gradient-to-r from-slate-900 via-slate-400 to-slate-900 bg-clip-text text-transparent [background-size:200%_auto] dark:from-white dark:via-slate-500 dark:to-white">
          Acme
        </span>
        <span className="animate-logo-text bg-gradient-to-r from-brand-600 via-violet-500 to-brand-600 bg-clip-text text-transparent [background-size:200%_auto] [animation-delay:1.2s] dark:from-brand-400 dark:via-violet-400 dark:to-brand-400">
          Desk
        </span>
      </span>
    </span>
  );
}
