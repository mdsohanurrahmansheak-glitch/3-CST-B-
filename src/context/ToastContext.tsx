import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react'
import type { ToastMsg } from '../types'

type ToastKind = ToastMsg['type']
interface ToastCtxValue { toast: (msg: string, type?: ToastKind) => void }

const ToastCtx = createContext<ToastCtxValue | null>(null)

export function useToast(): ToastCtxValue {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

const STYLES: Record<ToastKind, { icon: LucideIcon; cls: string }> = {
  success: { icon: CheckCircle2, cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  error: { icon: XCircle, cls: 'border-rose-200 bg-rose-50 text-rose-800' },
  info: { icon: Info, cls: 'border-sky-200 bg-sky-50 text-sky-800' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  const toast = useCallback((message: string, type: ToastKind = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
        {toasts.map((t) => {
          const S = STYLES[t.type]
          const Icon = S.icon
          return (
            <div key={t.id} className={`animate-slide-up flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-card ${S.cls}`}>
              <Icon size={18} className="mt-0.5 shrink-0" />
              <span>{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}