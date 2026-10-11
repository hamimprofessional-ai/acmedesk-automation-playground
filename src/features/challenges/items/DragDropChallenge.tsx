import { useState } from 'react';
import { ChallengeShell } from '../ChallengeShell';
import { cn } from '@/lib/cn';

const START = ['Draft release notes', 'Review metrics', 'Update changelog', 'Tag release'];
const CARDS = ['Ship it', 'Write docs', 'Fix bug'];

export function DragDropChallenge() {
  const [order, setOrder] = useState<string[]>(START);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [todo, setTodo] = useState<string[]>(['Ship it', 'Write docs', 'Fix bug']);
  const [done, setDone] = useState<string[]>([]);
  const [draggingCard, setDraggingCard] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const log = (m: string) => setHistory((h) => [m, ...h].slice(0, 8));

  function onDropReorder(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      log(`reordered "${moved}" → position ${targetIndex + 1}`);
      return next;
    });
    setDragIndex(null);
  }

  function moveToDone(card: string) {
    setTodo((prev) => prev.filter((c) => c !== card));
    setDone((prev) => (prev.includes(card) ? prev : [...prev, card]));
    log(`moved "${card}" → Done`);
  }

  return (
    <ChallengeShell
      title="Drag & drop"
      tier="hard"
      blurb="Native HTML5 drag events (dragstart / dragover / drop) are notoriously awkward to automate — pointer sequences and synthesized events both have pitfalls."
      goal={[
        'Reorder the list so "Review metrics" sits first.',
        'Drag the card labeled "Ship it" into the Done column.',
        'Verify the final order and card counts in the log.',
      ]}
      selector='locator.dragTo() or a dispatchEvent drag sequence'
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <section className="space-y-2" data-testid="sortable-stage">
          <h2 className="text-sm font-medium">Release checklist (drag to reorder)</h2>
          <ul className="space-y-1">
            {order.map((label, i) => (
              <li
                key={label}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDropReorder(i)}
                onDragEnd={() => setDragIndex(null)}
                data-testid={`sortable-item-${label}`}
                className={cn(
                  'cursor-grab rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900',
                  dragIndex === i && 'opacity-50',
                )}
              >
                {i + 1}. {label}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2" data-testid="kanban-stage">
          <h2 className="text-sm font-medium">Bulk actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="min-h-32 rounded-lg border border-dashed border-slate-300 p-2 dark:border-slate-700"
              data-testid="bucket-todo"
              onDragOver={(e) => e.preventDefault()}
            >
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">To do</p>
              {todo.map((card) => (
                <div
                  key={card}
                  draggable
                  onDragStart={() => setDraggingCard(card)}
                  data-testid={`card-${card}`}
                  className="mb-1 cursor-grab rounded-md bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800"
                >
                  {card}
                </div>
              ))}
            </div>

            <div
              className="grid content-start rounded-lg border-2 border-dashed border-brand-300 bg-brand-50/40 p-3 dark:border-brand-800 dark:bg-brand-950/20"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => draggingCard && moveToDone(draggingCard)}
              data-testid="done-dropzone"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
                Done
              </span>
              {done.length === 0 ? (
                <span className="mt-2 text-xs text-slate-400">Drop cards here</span>
              ) : (
                done.map((c) => (
                  <span key={c} className="mt-2 rounded-md bg-white px-2 py-1 text-sm dark:bg-slate-800">
                    {c}
                  </span>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-slate-50 p-3 text-xs sm:col-span-2 dark:bg-slate-800/50" data-testid="dnd-log">
          {history.length === 0 ? <span className="text-slate-400">Drag actions appear here…</span> : history.map((h) => <div key={h}>{h}</div>)}
        </section>
      </div>
    </ChallengeShell>
  );
}
