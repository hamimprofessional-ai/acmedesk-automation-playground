import { useEffect, useRef } from 'react';
import { defineTagInput } from './tag-input';

defineTagInput();

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  testId?: string;
}

export function TagInput({ value, onChange, testId = 'tag-input' }: TagInputProps) {
  const ref = useRef<HTMLElement & { value: string }>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) => onChange((e as CustomEvent<string[]>).detail.join(','));
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, [onChange]);

  useEffect(() => {
    const el = ref.current;
    if (el && el.value !== value) el.value = value;
  }, [value]);

  return (
    // @ts-expect-error custom element
    <acmedesk-tag-input ref={ref} data-testid={testId} value={value} />
  );
}
