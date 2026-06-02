// Toast / notification system
// In-page transient messages (success / error / info)
// Backed by Zustand + auto-dismiss

'use client'

import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  variant: ToastVariant
  title?: string
  message: string
  duration: number
}

interface ToastState {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = 't' + Date.now() + Math.random().toString(36).slice(2, 6)
    const duration = t.duration ?? 4000
    set(s => ({ toasts: [...s.toasts, { id, duration, ...t }] }))
    if (duration > 0) {
      setTimeout(() => get().dismiss(id), duration)
    }
  },
  dismiss: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

export const toast = {
  success: (message: string, title?: string) => useToastStore.getState().push({ variant: 'success', message, title }),
  error:   (message: string, title?: string) => useToastStore.getState().push({ variant: 'error', message, title, duration: 6000 }),
  info:    (message: string, title?: string) => useToastStore.getState().push({ variant: 'info', message, title }),
  warning: (message: string, title?: string) => useToastStore.getState().push({ variant: 'warning', message, title }),
}
