import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import type { ContextMenuItem } from '@/components/ContextMenu';

interface DropdownMenuProps {
  anchor: DOMRect;
  items: ContextMenuItem[];
  onClose: () => void;
  testId?: string;
  triggerId?: string;
}

export function DropdownMenu({ anchor, items, onClose, testId = 'dropdown-menu', triggerId }: DropdownMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>(() => ({
    left: Math.max(8, anchor.right - 192),
    top: anchor.bottom + 6,
  }));

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left = anchor.right - w;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    let top = anchor.bottom + 6;
    if (top + h + 8 > window.innerHeight) {
      top = Math.max(8, anchor.top - h - 6);
    }
    setPos({ left, top });
  }, [anchor]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (triggerId && (e.target as HTMLElement).closest?.(`[data-testid="${triggerId}"]`)) return;
      onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onScroll = () => onClose();
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [onClose, triggerId]);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      data-testid={testId}
      style={{ left: pos.left, top: pos.top }}
      className="fixed z-[90] min-w-48 max-w-xs overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900"
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={cn(
            'flex w-full items-center gap-2 px-3 py-2 text-start hover:bg-slate-100 dark:hover:bg-slate-800',
            item.danger ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200',
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}