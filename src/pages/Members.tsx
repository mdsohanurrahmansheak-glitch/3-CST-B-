import { useEffect, useMemo, useState } from 'react'
import { Copy, Lock, Phone, Plus, Search, ShieldCheck, Users } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Avatar, Badge, Button, Card, EmptyState, Input, Modal, SectionTitle, Spinner } from '../components/ui'
import type { RegisterPayload, User } from '../types'

type NewStudent = Omit<RegisterPayload, 'password'>

export default function Members() {
  const { user, isCR } = useAuth()
  const { toast } = useToast()
  const [members, setMembers] = useState<User[] | null>(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<NewStudent>({ name: '', roll: '', email: '', contact: '' })

  const load = () => api.listUsers().then(setMembers)
  useEffect(() => { load() }, [])

  const filtered = useMemo(
    () => (members ?? []).filter((m) =>
      !q || m.name.toLowerCase().includes(q.toLowerCase()) || String(m.roll).includes(q)),
    [members, q]
  )

  async function add() {
    if (!form.name || !form.roll || !form.email) return toast('Name, roll and email are required', 'error')
    await api.addStudent(form)
    toast('Student added successfully')
    setOpen(false); setForm({ name: '', roll: '', email: '', contact: '' }); load()
  }

  function copy(contact: string) {
    navigator.clipboard?.writeText(contact)
    toast('Contact number copied', 'info')
  }

  if (!members) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Class Members"
        subtitle={`${members.length} registered member(s) · 3/CST/B`}
        right={isCR ? <Button variant="accent" size="sm" onClick={() => setOpen(true)}><Plus size={15} /> Add Student</Button> : undefined}
      />

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or roll…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No members found" hint="Try a different search term." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => {
            const isMe = m.uid === user?.uid
            return (
              <Card key={m.uid} className="p-5 transition hover:shadow-glow">
                <div className="flex items-start gap-3">
                  <Avatar name={m.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-sm font-extrabold text-primary">{m.name}</h3>
                      {m.role === 'cr' && <Badge tone="accent"><ShieldCheck size={10} /> CR</Badge>}
                      {isMe && <Badge tone="emerald">You</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">Roll: {m.roll}</p>
                    <p className="truncate text-[11px] text-slate-400">{m.email}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Contact Number</p>
                  {isCR ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold tracking-wide text-primary">{m.contact || '—'}</span>
                      <div className="flex gap-1">
                        <button onClick={() => copy(m.contact)} className="rounded-lg bg-white p-1.5 text-slate-500 shadow-sm hover:text-accent"><Copy size={13} /></button>
                        <a href={`tel:${m.contact}`} className="rounded-lg bg-white p-1.5 text-slate-500 shadow-sm hover:text-emerald-600"><Phone size={13} /></a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <Lock size={12} /> •••••••• · Only CR can view
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Student">
        <div className="space-y-3">
          <Input label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Roll Number *" value={form.roll} onChange={(e) => setForm({ ...form, roll: e.target.value })} />
          <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Contact Number" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="accent" onClick={add}>Add</Button>
        </div>
      </Modal>
    </div>
  )
}