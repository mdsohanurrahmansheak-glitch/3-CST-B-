import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { X } from 'lucide-react'

export function Card({ className = '', children, ...rest }: { className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl border border-slate-100 bg-white shadow-card ${className}`} {...rest}>{children}</div>
}

type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'soft'
type ButtonSize = 'sm' | 'md' | 'lg'

const BTN: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-700 shadow-soft',
  accent: 'bg-accent text-white hover:bg-accent-600 shadow-glow',
  outline: 'border border-slate-200 bg-white text-primary hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  soft: 'bg-primary-50 text-primary hover:bg-primary-100',
}
const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 ${BTN[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

type BadgeTone = 'slate' | 'primary' | 'accent' | 'amber' | 'rose' | 'emerald' | 'violet'

const TONES: Record<BadgeTone, string> = {
  slate: 'bg-slate-100 text-slate-700',
  primary: 'bg-primary-50 text-primary',
  accent: 'bg-accent-50 text-accent-600',
  amber: 'bg-amber-100 text-amber-800',
  rose: 'bg-rose-100 text-rose-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  violet: 'bg-violet-100 text-violet-700',
}

export function Badge({ children, tone = 'slate', className = '' }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${TONES[tone]} ${className}`}>{children}</span>
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string }
export function Input({ label, className = '', ...rest }: InputProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>}
      <input className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/10 ${className}`} {...rest} />
    </label>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string }
export function Textarea({ label, className = '', ...rest }: TextareaProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>}
      <textarea rows={3} className={`w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/10 ${className}`} {...rest} />
    </label>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string }
export function Select({ label, className = '', children, ...rest }: SelectProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>}
      <select className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10 ${className}`} {...rest}>{children}</select>
    </label>
  )
}

interface ModalProps { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; width?: string }
export function Modal({ open, onClose, title, subtitle, children, width = 'max-w-lg' }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-fade-in" onClick={onClose}>
      <div className={`animate-scale-in w-full ${width} max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl`} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-primary">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return <div className={`flex items-center justify-center py-12 ${className}`}><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-accent" /></div>
}

export function EmptyState({ icon: Icon, title, hint }: { icon?: LucideIcon; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 py-14 text-center">
      {Icon && <Icon size={34} className="mb-3 text-slate-300" />}
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {hint && <p className="mt-1 max-w-sm px-6 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

type AvatarSize = 'sm' | 'md' | 'lg'
export function Avatar({ name = '', size = 'md' }: { name?: string; size?: AvatarSize }) {
  const sizes: Record<AvatarSize, string> = { sm: 'h-8 w-8 text-[11px]', md: 'h-10 w-10 text-xs', lg: 'h-14 w-14 text-base' }
  const init = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  const grads = ['from-sky-500 to-blue-600', 'from-teal-500 to-emerald-600', 'from-violet-500 to-purple-600', 'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600', 'from-indigo-500 to-blue-700']
  return <div className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${grads[h % grads.length]} ${sizes[size]}`}>{init}</div>
}

export function SectionTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-primary">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}