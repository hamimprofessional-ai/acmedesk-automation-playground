import { useCallback, useEffect, useRef, useState } from 'react';
import { ChallengeShell } from '../ChallengeShell';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/cn';

interface FeedItem {
  id: string;
  ref: string;
  message: string;
  level: 'info' | 'warn' | 'error';
  at: string;
}

interface FeedPage {
  items: FeedItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

const LEVEL_STYLES: Record<FeedItem['level'], string> = {
  info: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  warn: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  error: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

export function InfiniteScrollChallenge() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await apiGet<FeedPage>('/api/challenges/feed', { page: pageRef.current + 1 });
      pageRef.current = data.page;
      hasMoreRef.current = data.hasMore;
      setHasMore(data.hasMore);
      setTotal(data.total);
      setItems((prev) => [...prev, ...data.items]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMore();
  }, [loadMore]);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root, rootMargin: '80px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  function reset() {
    pageRef.current = 0;
    hasMoreRef.current = true;
    setItems([]);
    setHasMore(true);
    setFound(null);
    loadMore();
  }

  return (
    <ChallengeShell
      title="Infinite scroll & lazy loading"
      tier="medium"
      blurb="Rows stream in from a paged endpoint as the inner container is scrolled. There is no 'Load more' button — the next page is only requested when the sentinel enters view."
      goal={[
        'Scroll the feed container (not the page) until "End of feed" is shown.',
        'Every row shares repeated messages — match by ref to avoid ambiguous locators.',
        'Click the row with ref LOG-0054 before scrolling back to the top.',
      ]}
      selector='[data-testid="feed-scroll"] >> [data-testid="feed-row"][data-ref="LOG-0054"]'
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">
            Audit log · loaded {items.length}
            {total ? ` of ${total}` : ''}
          </h2>
          <button type="button" className="btn-secondary" onClick={reset}>
            Reset feed
          </button>
        </div>

        <div
          ref={scrollRef}
          data-testid="feed-scroll"
          className="feed h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700"
        >
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  data-testid="feed-row"
                  data-ref={item.ref}
                  onClick={() => setFound(item.ref)}
                  className={cn(
                    'row flex w-full items-center gap-3 px-3 py-3 text-start text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60',
                    found === item.ref && 'bg-emerald-50 dark:bg-emerald-950/40',
                  )}
                >
                  <span className="font-mono text-xs text-slate-400">{item.ref}</span>
                  <span className={cn('badge', LEVEL_STYLES[item.level])}>{item.level}</span>
                  <span className="flex-1">{item.message}</span>
                </button>
              </li>
            ))}
          </ul>

          <div ref={sentinelRef} data-testid="feed-sentinel" className="h-8" />

          {loading && (
            <p className="px-3 pb-3 text-center text-xs text-slate-400">Loading more…</p>
          )}
          {!hasMore && (
            <p data-testid="feed-end" className="px-3 pb-3 text-center text-xs text-slate-400">
              End of feed
            </p>
          )}
        </div>

        {found && (
          <p className="result text-sm text-emerald-600 dark:text-emerald-400">
            Opened {found}
            {found === 'LOG-0054' ? ' — correct row!' : ''}
          </p>
        )}
      </div>
    </ChallengeShell>
  );
}
