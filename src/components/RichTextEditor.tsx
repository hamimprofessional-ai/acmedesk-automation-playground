import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/cn';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  testId?: string;
  placeholder?: string;
  minHeightClass?: string;
}

const COMMANDS: { command: string; label: string; icon: typeof Bold; testId: string }[] = [
  { command: 'bold', label: 'Bold', icon: Bold, testId: 'bold' },
  { command: 'italic', label: 'Italic', icon: Italic, testId: 'italic' },
  { command: 'underline', label: 'Underline', icon: Underline, testId: 'underline' },
  { command: 'insertUnorderedList', label: 'Bullet list', icon: List, testId: 'ul' },
  { command: 'insertOrderedList', label: 'Numbered list', icon: ListOrdered, testId: 'ol' },
];

export function RichTextEditor({
  value,
  onChange,
  testId = 'rte',
  placeholder,
  minHeightClass = 'min-h-28',
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  function run(command: string) {
    ref.current?.focus();
    document.execCommand(command, false);
    onChange(ref.current?.innerHTML ?? '');
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 dark:border-slate-700">
      <div
        data-testid={`${testId}-toolbar`}
        className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/60"
        role="toolbar"
        aria-label="Text formatting"
      >
        {COMMANDS.map(({ command, label, icon: Icon, testId: tid }) => (
          <button
            key={command}
            type="button"
            aria-label={label}
            data-testid={`${testId}-${tid}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(command)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-100"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        {placeholder && (
          <span className="ms-auto pe-1 text-[11px] text-slate-400">{placeholder}</span>
        )}
      </div>
      <div
        ref={ref}
        role="textbox"
        contentEditable
        suppressContentEditableWarning
        data-testid={`${testId}-editor`}
        data-placeholder={placeholder}
        onInput={() => onChange(ref.current?.innerHTML ?? '')}
        className={cn(
          'px-3 py-2 text-sm text-slate-800 outline-none dark:text-slate-100',
          minHeightClass,
          !value && 'text-slate-400',
        )}
      />
    </div>
  );
}