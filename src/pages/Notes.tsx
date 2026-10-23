import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, FileText, FolderOpen, Link2, Plus, Search, Trash2, Video } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Badge, Button, Card, EmptyState, Input, Modal, SectionTitle, Select, Spinner, Textarea } from '../components/ui'
import type { Note, NoteForm, NoteType, Subject } from '../types'
import type { LucideIcon } from 'lucide-react'

const TYPE_ICON: Record<NoteType, LucideIcon> = { PDF: FileText, Link: Link2, Video: Video, Doc: FileText }

export default function Notes() {
  const { user, isCR } = useAuth()
  const { toast } = useToast()
  const [notes, setNotes] = useState<Note[] | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<NoteForm>({ title: '', subjectCode: '', type: 'PDF', description: '', url: '' })
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.listNotes().then(setNotes)
    api.listSubjects().then(setSubjects)
  }, [])

  const filtered = useMemo(() => {
    if (!notes) return []
    return notes.filter((n) =>
      (filter === 'all' || n.subjectCode === filter) &&
      (!q || n.title.toLowerCase().includes(q.toLowerCase()) || n.description?.toLowerCase().includes(q.toLowerCase()))
    )
  }, [notes, q, filter])

  async function add() {
    if (!user) return
    if (!form.title || !form.subjectCode) return toast('Title and subject are required', 'error')
    if (form.type === 'Link' && !form.url) return toast('Please provide a URL', 'error')
    await api.addNote(form, user.uid, file)
    toast('Note uploaded successfully')
    setOpen(false); setForm({ title: '', subjectCode: '', type: 'PDF', description: '', url: '' }); setFile(null)
    api.listNotes().then(setNotes)
  }

  async function remove(n: Note) {
    if (!confirm(`Delete "${n.title}"?`)) return
    await api.deleteNote(n.id)
    toast('Note deleted', 'info')
    api.listNotes().then(setNotes)
  }

  if (!notes) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Notes & Resources"
        subtitle={`${notes.length} resource(s) available`}
        right={isCR ? <Button variant="accent" size="sm" onClick={() => setOpen(true)}><Plus size={15} /> Add Note</Button> : undefined}
      />

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-accent">
          <option value="all">All Subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.code}>{s.code} — {s.name}</option>)}
        </select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No notes found" hint="Try a different search, or ask your CR to upload resources." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((n) => {
            const Icon = TYPE_ICON[n.type]
            return (
              <Card key={n.id} className="flex flex-col p-5 transition hover:shadow-glow">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent"><Icon size={18} /></div>
                  <div className="flex items-center gap-1.5">
                    <Badge tone="slate">{n.type}</Badge>
                    {isCR && <button onClick={() => remove(n)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>}
                  </div>
                </div>
                <h3 className="text-sm font-extrabold text-primary">{n.title}</h3>
                <p className="mt-0.5 text-[11px] font-semibold text-accent-600">Subject {n.subjectCode}</p>
                <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{n.description}</p>
                <a href={n.url || '#'} target="_blank" rel="noreferrer"
                  className={`mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${n.url ? 'bg-primary text-white hover:bg-primary-700' : 'pointer-events-none bg-slate-100 text-slate-400'}`}>
                  <Download size={14} /> {n.type === 'Link' || n.type === 'Video' ? 'Open Resource' : 'Download / View'}
                </a>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Note / Resource">
        <div className="space-y-3">
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Subject *" value={form.subjectCode} onChange={(e) => setForm({ ...form, subjectCode: e.target.value })}>
              <option value="">— Select —</option>
              {subjects.map((s) => <option key={s.id} value={s.code}>{s.code} — {s.name}</option>)}
            </Select>
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as NoteType })}>
              {(['PDF', 'Doc', 'Link', 'Video'] as const).map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          {(form.type === 'Link' || form.type === 'Video') ? (
            <Input label="URL *" placeholder="https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          ) : (
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">File Upload (via ImgBB — 32 MB max)</span>
              <input ref={fileRef} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white" />
            </div>
          )}
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="accent" onClick={add}>Upload</Button>
        </div>
      </Modal>
    </div>
  )
}