import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export type Tier = 'easy' | 'medium' | 'hard';

export const TIER_STYLES: Record<Tier, string> = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  hard: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

export function ChallengeShell({
  title,
  blurb,
  tier,
  goal,
  selector,
  children,
}: {
  title: string;
  blurb: string;
  tier: Tier;
  goal: string[];
  selector?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        to="/challenges"
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline dark:text-brand-400"
      >
        ← All challenges
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">
            {title}
          </h1>
          <span className={cn('badge capitalize', TIER_STYLES[tier])}>{tier}</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{blurb}</p>
      </header>

      <section className="card goal p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your task</h2>
        <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-slate-600 dark:text-slate-300">
          {goal.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
        {selector && (
          <p className="mt-3 text-xs text-slate-400">
            Suggested anchor: <code className="font-mono">{selector}</code>
          </p>
        )}
      </section>

      <section className="card stage p-5">
        {children}
      </section>
    </div>
  );
}
