import { useEffect, useState } from 'react'
import { AlertTriangle, Calendar, Megaphone, Plus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Badge, Button, Card, EmptyState, Input, Modal, SectionTitle, Select, Spinner, Textarea } from '../components/ui'
import type { Notice, NoticeType } from '../types'

export default function Notices() {
  const { user, isCR } = useAuth()
  const { toast } = useToast()
  const [notices, setNotices] = useState<Notice[] | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ title: string; type: NoticeType; description: string }>({
    title: '', type: 'General', description: '',
  })

  const load = () => api.listNotices().then(setNotices)
  useEffect(() => { load() }, [])

  async function add() {
    if (!user) return
    if (!form.title || !form.description) return toast('Title and description required', 'error')
    await api.addNotice(form, user.uid)
    toast('Notice posted')
    setOpen(false); setForm({ title: '', type: 'General', description: '' }); load()
  }

  async function remove(n: Notice) {
    if (!confirm(`Delete "${n.title}"?`)) return
    await api.deleteNotice(n.id)
    toast('Notice deleted', 'info'); load()
  }

  if (!notices) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Notices"
        subtitle={`${notices.length} notice(s) published`}
        right={isCR ? <Button variant="accent" size="sm" onClick={() => setOpen(true)}><Plus size={15} /> Post Notice</Button> : undefined}
      />

      {notices.length === 0 ? (
        <EmptyState icon={Megaphone} title="No notices yet" hint="CR can post announcements, exams, holidays and urgent notices." />
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <Card key={n.id} className="group flex items-start gap-3 p-5">
              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${n.type === 'Urgent' ? 'bg-rose-100 text-rose-600' : n.type === 'Exam' ? 'bg-primary-50 text-primary' : 'bg-accent-50 text-accent'}`}>
                {n.type === 'Urgent' ? <AlertTriangle size={18} /> : <Megaphone size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-extrabold text-primary">{n.title}</h3>
                  <Badge tone={n.type === 'Urgent' ? 'rose' : n.type === 'Exam' ? 'primary' : n.type === 'Holiday' ? 'emerald' : 'slate'}>{n.type}</Badge>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{n.description}</p>
                <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                  <Calendar size={10} />
                  {new Date(typeof n.createdAt === 'number' ? n.createdAt : Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {isCR && (
                <button onClick={() => remove(n)} className="rounded-lg p-1.5 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 size={14} />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Post Notice">
        <div className="space-y-3">
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as NoticeType })}>
            {(['Exam', 'Holiday', 'General', 'Urgent'] as const).map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Textarea label="Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="accent" onClick={add}>Post</Button>
        </div>
      </Modal>
    </div>
  )
}