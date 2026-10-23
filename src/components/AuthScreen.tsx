import { useState } from 'react'
import { GraduationCap, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button, Input } from './ui'

type Tab = 'student' | 'cr' | 'register'

const TABS: { id: Tab; label: string }[] = [
  { id: 'student', label: 'Student Login' },
  { id: 'cr', label: 'CR Login' },
  { id: 'register', label: 'Registration' },
]

export default function AuthScreen() {
  const { login, loginCR, register } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('student')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({
    name: '', roll: '', email: '', contact: '', password: '', confirm: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      if (tab === 'register') {
        if (!form.name || !form.roll || !form.email || !form.contact || !form.password) throw new Error('Please fill in all required fields.')
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters.')
        if (form.password !== form.confirm) throw new Error('Passwords do not match.')
        await register({ name: form.name, roll: form.roll, email: form.email, contact: form.contact, password: form.password })
        toast('Account created. Welcome to 3/CST/B!')
      } else if (tab === 'cr') {
        await loginCR(form.email, form.password)
        toast('Welcome back, Class Representative')
      } else {
        await login(form.email, form.password)
        toast('Logged in successfully')
      }
    } catch (e2) {
      const msg = (e2 as Error)?.message?.replace('Firebase: ', '') || 'Something went wrong'
      setErr(msg)
      toast(msg, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-primary">
      {/* Decorative Background Elements */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[26rem] w-[26rem] rounded-full bg-accent/30 blur-[110px] animate-float" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-sky-400/20 blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '26px 26px' }} />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-10 px-4 py-10 lg:flex-row lg:justify-between lg:gap-16">
        {/* Left Side - Branding */}
        <div className="w-full max-w-md text-center lg:text-left">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur lg:mx-0">
            <GraduationCap className="text-accent" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            3/CST/B <span className="text-accent">Class Portal</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Jashore Polytechnic Institute · Department of Computer Science & Technology
            <br />
            <span className="text-slate-400">3rd Semester · Section B · 1st Shift</span>
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-slate-200 backdrop-blur">
            <ShieldCheck size={15} className="text-accent" />
            Protected portal — login required for all access
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full max-w-md animate-slide-up rounded-3xl border border-white/20 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setErr('') }}
                className={`rounded-lg px-2 py-2 text-[12px] font-bold transition ${tab === t.id ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {tab === 'register' && (
              <>
                <Input label="Full Name *" placeholder="e.g. Md. Rakib Hasan" value={form.name} onChange={set('name')} required />
                <Input label="Roll Number *" placeholder="e.g. 492102" value={form.roll} onChange={set('roll')} required />
              </>
            )}

            <Input label="Email *" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />

            {tab === 'register' && (
              <Input label="Contact Number * (private)" placeholder="01XXXXXXXXX" value={form.contact} onChange={set('contact')} required />
            )}

            <Input label="Password *" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />

            {tab === 'register' && (
              <Input label="Confirm Password *" type="password" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} required />
            )}

            {err && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{err}</div>
            )}

            <Button type="submit" variant="primary" className="w-full py-3" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              {busy ? 'Please wait…' : tab === 'register' ? 'Create Account' : tab === 'cr' ? 'Login as CR' : 'Login'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}