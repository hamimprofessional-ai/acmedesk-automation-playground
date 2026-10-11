import { useRef, useState } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { apiUpload } from '@/lib/api';
import { toast } from '@/store/toast';
import { cn } from '@/lib/cn';

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string;
}

export function FileUpload({
  onUploaded,
  accept = 'image/png,image/jpeg,application/pdf,text/csv',
  testId = 'file-upload',
}: {
  onUploaded?: (files: UploadedFile[]) => void;
  accept?: string;
  testId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setBusy(true);
    try {
      const res = await apiUpload<{ ok: boolean; files: UploadedFile[] }>('/api/uploads', list);
      setUploaded((u) => [...u, ...res.files]);
      onUploaded?.(res.files);
      toast.success(`${res.files.length} file(s) uploaded`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <div
        data-testid={testId}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          upload(e.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
          dragOver
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
            : 'border-slate-300 hover:border-brand-400 dark:border-slate-700',
        )}
      >
        <UploadCloud className="h-6 w-6 text-slate-400" />
        <p className="text-sm font-medium">
          {busy ? 'Uploading…' : 'Drag & drop files here or click to browse'}
        </p>
        <p className="text-xs text-slate-400">PNG, JPG, PDF or CSV — max 5 MB each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          hidden
          data-testid={`${testId}-input`}
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>

      {uploaded.length > 0 && (
        <ul className="mt-3 space-y-1.5" data-testid={`${testId}-list`}>
          {uploaded.map((f) => (
            <li
              key={f.url}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <FileIcon className="h-4 w-4 text-slate-400" />
              <span className="flex-1 truncate">{f.name}</span>
              <span className="text-xs text-slate-400">{Math.round(f.size / 1024)} KB</span>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => setUploaded((u) => u.filter((x) => x.url !== f.url))}
                className="text-slate-400 hover:text-rose-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
