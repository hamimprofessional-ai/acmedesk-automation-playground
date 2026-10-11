import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  testId?: string;
}

export function Accordion({ items, testId = 'accordion' }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div
      data-testid={testId}
      className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900"
    >
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              aria-expanded={open}
              data-testid={`${testId}-${item.id}`}
              onClick={() => setOpenId(open ? null : item.id)}
              className={cn(
                'flex w-full items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/50',
                open && 'bg-slate-50 dark:bg-slate-800/50',
              )}
            >
              {item.title}
              <ChevronDown
                className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
              />
            </button>
            {open && (
              <div
                data-testid={`${testId}-${item.id}-panel`}
                className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300"
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}