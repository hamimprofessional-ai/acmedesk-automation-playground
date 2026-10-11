import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'> & { id?: string }) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = toast.id ?? crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

type ToastInput = string | { title: string; message?: string; variant?: ToastVariant; duration?: number };

function normalize(input: ToastInput, variant: ToastVariant) {
  if (typeof input === 'string') {
    return { title: input, variant, duration: 4000 };
  }
  return { variant, duration: 4000, ...input };
}

export const toast = {
  success: (input: ToastInput) => useToastStore.getState().push(normalize(input, 'success')),
  error: (input: ToastInput) => useToastStore.getState().push(normalize(input, 'error')),
  info: (input: ToastInput) => useToastStore.getState().push(normalize(input, 'info')),
  warning: (input: ToastInput) => useToastStore.getState().push(normalize(input, 'warning')),
};
