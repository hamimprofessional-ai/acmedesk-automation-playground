import { useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Indent,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Outdent,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  testId?: string;
  placeholder?: string;
  minHeightClass?: string;
}

interface ToolButton {
  command: string;
  label: string;
  icon: LucideIcon;
  testId: string;
  value?: string;
}

const GROUPS: ToolButton[][] = [
  [
    { command: 'bold', label: 'Bold', icon: Bold, testId: 'bold' },
    { command: 'italic', label: 'Italic', icon: Italic, testId: 'italic' },
    { command: 'underline', label: 'Underline', icon: Underline, testId: 'underline' },
    { command: 'strikeThrough', label: 'Strikethrough', icon: Strikethrough, testId: 'strike' },
  ],
  [
    { command: 'formatBlock', value: 'h1', label: 'Heading 1', icon: Heading1, testId: 'h1' },
    { command: 'formatBlock', value: 'h2', label: 'Heading 2', icon: Heading2, testId: 'h2' },
    { command: 'formatBlock', value: 'h3', label: 'Heading 3', icon: Heading3, testId: 'h3' },
    { command: 'formatBlock', value: 'p', label: 'Paragraph', icon: Pilcrow, testId: 'paragraph' },
    { command: 'formatBlock', value: 'blockquote', label: 'Quote', icon: Quote, testId: 'quote' },
    { command: 'formatBlock', value: 'pre', label: 'Code block', icon: Code2, testId: 'code' },
  ],
  [
    { command: 'insertUnorderedList', label: 'Bullet list', icon: List, testId: 'ul' },
    { command: 'insertOrderedList', label: 'Numbered list', icon: ListOrdered, testId: 'ol' },
    { command: 'outdent', label: 'Decrease indent', icon: Outdent, testId: 'outdent' },
    { command: 'indent', label: 'Increase indent', icon: Indent, testId: 'indent' },
  ],
  [
    { command: 'justifyLeft', label: 'Align left', icon: AlignLeft, testId: 'align-left' },
    { command: 'justifyCenter', label: 'Align center', icon: AlignCenter, testId: 'align-center' },
    { command: 'justifyRight', label: 'Align right', icon: AlignRight, testId: 'align-right' },
    { command: 'justifyFull', label: 'Justify', icon: AlignJustify, testId: 'align-justify' },
  ],
  [
    { command: 'createLink', label: 'Insert link', icon: Link2, testId: 'link' },
    { command: 'unlink', label: 'Remove link', icon: Unlink, testId: 'unlink' },
    { command: 'insertHorizontalRule', label: 'Horizontal rule', icon: Minus, testId: 'hr' },
  ],
  [
    { command: 'removeFormat', label: 'Clear formatting', icon: RemoveFormatting, testId: 'clear' },
    { command: 'undo', label: 'Undo', icon: Undo2, testId: 'undo' },
    { command: 'redo', label: 'Redo', icon: Redo2, testId: 'redo' },
  ],
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

  function run({ command, value: commandValue }: ToolButton) {
    const editor = ref.current;
    if (!editor) return;
    editor.focus();

    if (command === 'createLink') {
      const url = window.prompt('Enter a URL', 'https://');
      if (!url) return;
      document.execCommand(command, false, url);
    } else {
      document.execCommand(command, false, commandValue);
    }

    onChange(editor.innerHTML);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 dark:border-slate-700">
      <div
        data-testid={`${testId}-toolbar`}
        className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/60"
        role="toolbar"
        aria-label="Text formatting"
      >
        {GROUPS.map((group, groupIndex) => (
          <div key={groupIndex} className="flex items-center gap-1">
            {groupIndex > 0 && (
              <span
                aria-hidden="true"
                className="mx-0.5 h-4 w-px bg-slate-200 dark:bg-slate-700"
              />
            )}
            {group.map((button) => (
              <button
                key={button.testId}
                type="button"
                aria-label={button.label}
                title={button.label}
                data-testid={`${testId}-${button.testId}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run(button)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              >
                <button.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
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
          'rte-content px-3 py-2 text-sm text-slate-800 outline-none dark:text-slate-100',
          minHeightClass,
          !value && 'text-slate-400',
        )}
      />
    </div>
  );
}
