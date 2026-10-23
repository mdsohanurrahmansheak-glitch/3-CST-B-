import { useEffect, useState } from 'react'
import { BookOpen, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Badge, Button, Card, EmptyState, Input, Modal, SectionTitle, Spinner, Textarea } from '../components/ui'
import { colorFor } from '../data/defaults'
import type { ClassHistoryEntry, Subject } from '../types'

const EMPTY: Omit<Subject, 'id'> & { id?: string } = { code: '', name: '', teacherName: '', teacherInitial: '', room: '', description: '' }

export default function Subjects() {
  const { user, isCR } = useAuth()
  const { toast } = useToast()
  const [subjects, setSubjects] = useState<Subject[] | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [detail, setDetail] = useState<Subject | null>(null)
  const [history, setHistory] = useState<ClassHistoryEntry[]>([])
  const [hForm, setHForm] = useState({ date: '', topic: '', presentCount: '', note: '' })
  const [hOpen, setHOpen] = useState(false)

  const load = () => api.listSubjects().then(setSubjects)
  useEffect(() => { load(); api.listHistory().then(setHistory) }, [])

  async function save() {
    if (!user) return
    if (!form.code || !form.name) return toast('Code and name are required', 'error')
    await api.saveSubject(form, user.uid)
    toast(form.id ? 'Subject updated' : 'Subject added')
    setOpen(false); setForm(EMPTY); load()
  }

  async function remove(s: Subject) {
    if (!confirm(`Delete subject ${s.code}?`)) return
    await api.deleteSubject(s.id)
    toast('Subject deleted', 'info'); load()
  }

  async function addHistory() {
    if (!detail) return
    if (!hForm.date || !hForm.topic) return toast('Date and topic required', 'error')
    const entry: ClassHistoryEntry = { subjectCode: detail.code, date: hForm.date, topic: hForm.topic, presentCount: Number(hForm.presentCount) || 0, note: hForm.note }
    await api.addHistory(entry)
    setHistory((h) => [{ ...entry }, ...h])
    setHForm({ date: '', topic: '', presentCount: '', note: '' })
    setHOpen(false)
    toast('Class history added')
  }

  if (!subjects) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Subjects & Class Details"
        subtitle={`${subjects.length} subject(s) this semester`}
        right={isCR ? <Button variant="accent" size="sm" onClick={() => { setForm(EMPTY); setOpen(true) }}><Plus size={15} /> Add Subject</Button> : undefined}
      />

      {subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects added" hint="The CR can add subjects for this semester." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((s) => {
            const count = history.filter((h) => h.subjectCode === s.code).length
            return (
              <Card key={s.id} className="group flex flex-col p-5 transition hover:shadow-glow">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <Badge tone="primary" className={colorFor(s.code)}>{s.code}</Badge>
                  {isCR && (
                    <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => { setForm(s); setOpen(true) }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"><Pencil size={14} /></button>
                      <button onClick={() => remove(s)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-extrabold leading-snug text-primary">{s.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{s.teacherName} ({s.teacherInitial})</p>
                <p className="mt-0.5 text-xs text-slate-400">Room: {s.room}</p>
                <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{s.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-semibold text-slate-500">{count} class record(s)</span>
                  <button onClick={() => setDetail(s)} className="flex items-center gap-1 text-[11px] font-bold text-accent hover:underline">Details <ChevronRight size={13} /></button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'Edit Subject' : 'Add Subject'}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Subject Code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input label="Subject Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Teacher Name" value={form.teacherName} onChange={(e) => setForm({ ...form, teacherName: e.target.value })} />
          <Input label="Teacher Initial" value={form.teacherInitial} onChange={(e) => setForm({ ...form, teacherInitial: e.target.value })} />
          <Input label="Room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          <div className="sm:col-span-2">
            <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="accent" onClick={save}>Save</Button>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ''} subtitle={detail ? `${detail.code} · ${detail.teacherName}` : ''} width="max-w-2xl">
        {detail && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">{detail.description || 'No description.'}</div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-primary">Class History</h4>
              {isCR && <Button size="sm" variant="soft" onClick={() => setHOpen(true)}><Plus size={13} /> Add Entry</Button>}
            </div>
            <div className="space-y-2">
              {history.filter((h) => h.subjectCode === detail.code).length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">No class records yet.</p>
              )}
              {history.filter((h) => h.subjectCode === detail.code).map((h, idx) => (
                <div key={h.id ?? idx} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-primary">{h.topic}</p>
                    <Badge tone="emerald">{h.presentCount} present</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{h.date}{h.note ? ` · ${h.note}` : ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={hOpen} onClose={() => setHOpen(false)} title="Add Class History">
        <div className="space-y-3">
          <Input label="Date" type="date" value={hForm.date} onChange={(e) => setHForm({ ...hForm, date: e.target.value })} />
          <Input label="Topic Covered" value={hForm.topic} onChange={(e) => setHForm({ ...hForm, topic: e.target.value })} />
          <Input label="Present Count" type="number" value={hForm.presentCount} onChange={(e) => setHForm({ ...hForm, presentCount: e.target.value })} />
          <Input label="Note (optional)" value={hForm.note} onChange={(e) => setHForm({ ...hForm, note: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setHOpen(false)}>Cancel</Button>
          <Button variant="accent" onClick={addHistory}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}