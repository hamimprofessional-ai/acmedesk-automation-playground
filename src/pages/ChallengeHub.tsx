import { Link } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import { CHALLENGES } from '@/features/challenges/registry';
import { TIER_STYLES } from '@/features/challenges/ChallengeShell';
import { cn } from '@/lib/cn';

export function ChallengeHub() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          <h1 className="text-xl font-semibold">
            Challenge Lab
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Deliberately difficult, self-contained widgets for practising real-world automation. Each
          challenge is an isolated page safe to break — production pages keep stable ids.
        </p>
      </header>

      <div className="challenge-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHALLENGES.map((c) => (
          <Link
            key={c.slug}
            to={`/challenges/${c.slug}`}
            className="challenge-card card group flex flex-col gap-2 p-4 transition hover:border-brand-400 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-medium">{c.title}</h2>
              <span className={cn('badge capitalize', TIER_STYLES[c.tier])}>{c.tier}</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{c.blurb}</p>
            <div className="mt-auto flex flex-wrap gap-1 pt-2">
              {c.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                >
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
