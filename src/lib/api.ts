type QueryValue = string | number | boolean | undefined | null | string[];

export type QueryParams = Record<string, QueryValue>;

function buildUrl(path: string, params?: QueryParams): string {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, String(v)));
    } else {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const MAX_ATTEMPTS = 3;

// When the mock service worker hasn't taken control yet, requests fall through
// to the SPA fallback and come back as the app's HTML instead of JSON.
function isHtmlResponse(res: Response): boolean {
  return (res.headers.get('content-type') ?? '').toLowerCase().includes('text/html');
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { message?: string };
      if (data?.message) message = data.message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }
  if (isHtmlResponse(res)) {
    throw new ApiError('The app is still starting up. Please refresh and try again.', res.status);
  }
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  let res = await fetch(input, init);
  for (let attempt = 1; attempt < MAX_ATTEMPTS && res.ok && isHtmlResponse(res); attempt++) {
    await wait(attempt * 250);
    res = await fetch(input, init);
  }
  return handle<T>(res);
}

export async function apiGet<T>(path: string, params?: QueryParams): Promise<T> {
  return request<T>(buildUrl(path, params));
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

export async function apiUpload<T>(path: string, files: File[]): Promise<T> {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  return request<T>(path, { method: 'POST', body: form });
}
