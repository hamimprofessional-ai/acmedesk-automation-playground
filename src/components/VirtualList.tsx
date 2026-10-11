import { useRef, useState, type ReactNode } from 'react';

// Only the visible window of rows is mounted in the DOM; off-screen rows do not
// exist until scrolled into view (adversarial scenario for element discovery).
interface VirtualListProps<T> {
  items: T[];
  rowHeight: number;
  height: number;
  overscan?: number;
  renderRow: (item: T, index: number) => ReactNode;
  testId?: string;
}

export function VirtualList<T>({
  items,
  rowHeight,
  height,
  overscan = 4,
  renderRow,
  testId = 'virtual-list',
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const visibleCount = Math.ceil(height / rowHeight);
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(items.length, start + visibleCount + overscan * 2);
  const slice = items.slice(start, end);

  return (
    <div
      ref={ref}
      data-testid={testId}
      className="overflow-y-auto"
      style={{ height }}
      onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
    >
      <div style={{ height: items.length * rowHeight, position: 'relative' }}>
        {slice.map((item, i) => {
          const index = start + i;
          return (
            <div
              key={index}
              style={{ position: 'absolute', top: index * rowHeight, height: rowHeight, left: 0, right: 0 }}
            >
              {renderRow(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
