import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Image as ImageIcon, Loader2, Pencil, Plus, RotateCcw, Save, Trash2, Upload, X } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Badge, Button, Card, Input, Modal, SectionTitle, Select, Spinner } from '../components/ui'
import { DAYS, DAY_LABELS, DEFAULT_TIMETABLE, colorFor } from '../data/defaults'
import type { Day, Period, RoutineDoc, RoutineCell, Subject, Timetable } from '../types'

const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o)) as T

interface EditingCell { day: Day; pid: string }

export default function Routine() {
  const { user, isCR } = useAuth()
  const { toast } = useToast()

  const [routine, setRoutine] = useState<RoutineDoc | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Timetable | null>(null)
  const [cell, setCell] = useState<EditingCell | null>(null)
  const [imgOpen, setImgOpen] = useState(false)
  const [periodModal, setPeriodModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newPeriod, setNewPeriod] = useState({ label: '', time: '' })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([api.getRoutine(), api.listSubjects()]).then(([r, s]) => {
      setRoutine(r); setSubjects(s)
    })
  }, [])

  const active: Timetable | undefined = editing ? draft ?? undefined : routine?.timetable
  const periods: Period[] = active?.periods ?? []
  const grid = active?.grid ?? {}

  const teachers = useMemo<string[]>(() => {
    const set = new Set<string>()
    subjects.forEach((s) => s.teacherInitial && set.add(s.teacherInitial))
    Object.values(grid).forEach((row) => {
      Object.values(row ?? {}).forEach((c) => c?.teacher && set.add(c.teacher))
    })
    return [...set].sort()
  }, [subjects, grid])

  const startEdit = () => { if (routine) { setDraft(clone(routine.timetable)); setEditing(true) } }
  const cancelEdit = () => { setDraft(null); setEditing(false) }

  async function persist(timetable: Timetable, msg: string) {
    if (!user) return
    await api.saveRoutine(timetable, user.uid)
    setRoutine((r) => (r ? { ...r, timetable } : r))
    toast(msg)
  }

  async function saveAll() {
    if (!draft) return
    await persist(draft, 'Routine saved successfully')
    setEditing(false); setDraft(null)
  }

  async function resetOfficial() {
    if (!confirm('Reset the routine to the official scanned version?')) return
    const fresh = clone(DEFAULT_TIMETABLE)
    await persist(fresh, 'Routine reset to official version')
    setDraft(fresh); setEditing(false)
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await api.uploadRoutineImage(file)
      setRoutine((r) => (r ? { ...r, officialImageURL: url } : r))
      toast('Official routine image uploaded via ImgBB')
    } catch (err) {
      toast((err as Error).message || 'Upload failed', 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function saveCell(payload: RoutineCell | null) {
    if (!draft || !cell) return
    const next = clone(draft)
    if (!next.grid[cell.day]) next.grid[cell.day] = {}
    
    if (payload) {
      const span = payload.colSpan || 1
      next.grid[cell.day]![cell.pid] = { ...payload, colSpan: span }
      
      if (span > 1) {
        const currentIndex = periods.findIndex(p => p.id === cell.pid)
        for (let i = 1; i < span; i++) {
          if (currentIndex + i < periods.length) {
            delete next.grid[cell.day]![periods[currentIndex + i].id]
          }
        }
      }
    } else {
      delete next.grid[cell.day]![cell.pid]
    }
    
    setDraft(next); setCell(null)
    toast(payload ? 'Cell updated — remember to Save Routine' : 'Cell cleared', 'info')
  }

  function addPeriod() {
    if (!draft) return
    if (!newPeriod.label || !newPeriod.time) return toast('Enter label and time', 'error')
    const next = clone(draft)
    const id = String(Math.max(0, ...next.periods.map((p) => Number(p.id))) + 1)
    next.periods.push({ id, label: newPeriod.label, time: newPeriod.time })
    setDraft(next); setPeriodModal(false); setNewPeriod({ label: '', time: '' })
    toast('Period added', 'info')
  }

  function removePeriod(pid: string) {
    if (!draft) return
    if (!confirm('Remove this period from the routine?')) return
    const next = clone(draft)
    next.periods = next.periods.filter((p) => p.id !== pid)
    Object.keys(next.grid).forEach((d) => {
      const key = d as Day
      if (next.grid[key]) delete next.grid[key]![pid]
    })
    setDraft(next)
    toast('Period removed', 'info')
  }

  if (!routine) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Class Routine"
        subtitle="Official weekly schedule — Sunday to Thursday"
        right={isCR ? (
          <div className="flex flex-wrap gap-2">
            {!editing ? (
              <Button variant="primary" size="sm" onClick={startEdit}><Pencil size={14} /> Edit Routine</Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setPeriodModal(true)}><Plus size={14} /> Add Period</Button>
                <Button variant="soft" size="sm" onClick={resetOfficial}><RotateCcw size={14} /> Reset</Button>
                <Button variant="ghost" size="sm" onClick={cancelEdit}><X size={14} /> Cancel</Button>
                <Button variant="accent" size="sm" onClick={saveAll}><Save size={14} /> Save Routine</Button>
              </>
            )}
          </div>
        ) : undefined}
      />

      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:w-40">
          {routine.officialImageURL
            ? <img src={routine.officialImageURL} alt="Official routine" className="h-full w-full object-cover" />
            : <div className="flex flex-col items-center gap-1 text-slate-400"><ImageIcon size={22} /><span className="text-[10px] font-semibold">No scanned copy</span></div>}
        </div>
        <div className="min-w-0 flex-1">
          <Badge tone="primary" className="mb-1.5"><CalendarDays size={11} /> Official Scanned Copy</Badge>
          <p className="text-sm font-semibold text-primary">Original approved routine — 3/CST/B, 1st Shift</p>
          <p className="mt-0.5 text-xs text-slate-500">The table below is generated from this official routine and can be customised by the CR.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImgOpen(true)}>View Full</Button>
          {isCR && (
            <>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
              <Button variant="soft" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} {uploading ? 'Uploading…' : 'Upload'}
              </Button>
            </>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {editing && <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">✏️ Edit mode — click any cell to change it, then press "Save Routine".</div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] table-fixed border-collapse text-left">
            <thead>
              <tr className="bg-primary text-white">
                <th className="sticky left-0 z-10 w-24 bg-primary px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider">
                  Day
                </th>
                {periods.map((p) => (
                  <th key={p.id} className="border-l border-primary-600 px-2 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wide">{p.label}</span>
                      {editing && (
                        <button onClick={() => removePeriod(p.id)} className="rounded p-0.5 text-rose-300 hover:bg-white/10 hover:text-rose-200">
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                    <span className="block text-[10px] font-normal text-slate-300 mt-0.5">{p.time}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => {
                let skipPeriods = 0

                return (
                  <tr key={day} className="border-b border-slate-100 last:border-0">
                    <td className="sticky left-0 z-10 bg-white px-3 py-3">
                      <p className="text-xs font-extrabold text-primary text-center">{day}</p>
                      <p className="text-[10px] text-slate-400 text-center">{DAY_LABELS[day].slice(0, 3)}</p>
                    </td>
                    {periods.map((p) => {
                      if (skipPeriods > 0) {
                        skipPeriods--
                        return null
                      }

                      const c: RoutineCell | undefined = grid[day]?.[p.id]
                      const subjectName = subjects.find((s) => s.code === c?.code)?.name || ''
                      const span = c?.colSpan && c.colSpan > 1 ? c.colSpan : 1

                      if (span > 1) {
                        skipPeriods = span - 1
                      }

                      if (!c) return (
                        <td key={p.id} className="p-1.5">
                          <button disabled={!editing} onClick={() => setCell({ day, pid: p.id })}
                            className={`h-full min-h-[80px] w-full rounded-lg border border-dashed border-slate-200 px-2 py-2 text-[11px] font-medium text-slate-300 transition ${editing ? 'hover:border-accent hover:bg-accent-50 hover:text-accent' : ''}`}>
                            {editing ? '+' : 'Free'}
                          </button>
                        </td>
                      )
                      return (
                        <td key={p.id} className="p-1.5" colSpan={span}>
                          <button disabled={!editing} onClick={() => setCell({ day, pid: p.id })}
                            className={`min-h-[80px] w-full rounded-lg border p-3 text-left transition ${colorFor(c.code)} ${editing ? 'cursor-pointer hover:ring-2 hover:ring-accent/40' : 'cursor-default'}`}>
                            <p className="text-[12px] font-extrabold leading-tight line-clamp-2">{subjectName}</p>
                            <p className="text-[10px] font-semibold opacity-90 mt-1">{c.code} · {c.teacher}</p>
                            <p className="text-[10px] opacity-70">{c.room}</p>
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <CellModal cell={cell} subjects={subjects} teachers={teachers} onClose={() => setCell(null)} onSave={saveCell} />

      <Modal open={imgOpen} onClose={() => setImgOpen(false)} title="Official Scanned Routine" subtitle="3/CST/B · 1st Shift" width="max-w-3xl">
        {routine.officialImageURL
          ? <img src={routine.officialImageURL} alt="Official routine full" className="w-full rounded-xl border border-slate-200" />
          : <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-400">No scanned image uploaded yet. {isCR && 'Use the Upload button to add it.'}</div>}
      </Modal>

      <Modal open={periodModal} onClose={() => setPeriodModal(false)} title="Add Period">
        <div className="space-y-3">
          <Input label="Period Label" placeholder="e.g. 8th" value={newPeriod.label} onChange={(e) => setNewPeriod((p) => ({ ...p, label: e.target.value }))} />
          <Input label="Time Range" placeholder="e.g. 01:15-02:00" value={newPeriod.time} onChange={(e) => setNewPeriod((p) => ({ ...p, time: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setPeriodModal(false)}>Cancel</Button>
            <Button variant="accent" onClick={addPeriod}><Plus size={15} /> Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

interface CellModalProps {
  cell: EditingCell | null
  subjects: Subject[]
  teachers: string[]
  onClose: () => void
  onSave: (payload: RoutineCell | null) => void
}

function CellModal({ cell, subjects, teachers, onClose, onSave }: CellModalProps) {
  const [code, setCode] = useState('')
  const [teacher, setTeacher] = useState('')
  const [room, setRoom] = useState('')
  const [colSpan, setColSpan] = useState(1)

  useEffect(() => {
    if (!cell) return
    setCode(''); setTeacher(''); setRoom(''); setColSpan(1)
  }, [cell])

  function pickSubject(c: string) {
    setCode(c)
    const s = subjects.find((x) => x.code === c)
    if (s) { setTeacher(s.teacherInitial || ''); setRoom(s.room || '') }
  }

  return (
    <Modal open={!!cell} onClose={onClose} title={`Edit Cell — ${cell?.day ?? ''}`} subtitle="Change subject, teacher or room">
      <div className="space-y-3">
        <Select label="Subject Code" value={code} onChange={(e) => pickSubject(e.target.value)}>
          <option value="">— Select subject —</option>
          {subjects.map((s) => <option key={s.id} value={s.code}>{s.code} — {s.name}</option>)}
        </Select>
        <Select label="Teacher Initial" value={teacher} onChange={(e) => setTeacher(e.target.value)}>
          <option value="">— Select teacher —</option>
          {teachers.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Input label="Room" placeholder="e.g. COM-308" value={room} onChange={(e) => setRoom(e.target.value)} />
        
        <div className="flex items-center gap-2 pt-2">
          <input 
            type="checkbox" 
            id="merge-checkbox" 
            checked={colSpan > 1} 
            onChange={(e) => setColSpan(e.target.checked ? 2 : 1)}
            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
          />
          <label htmlFor="merge-checkbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
            Merge with next period (2 slots)
          </label>
        </div>

        <div className="flex flex-wrap justify-between gap-2 pt-2">
          <Button variant="danger" size="sm" onClick={() => onSave(null)}><Trash2 size={14} /> Clear Cell</Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="accent" size="sm" disabled={!code} onClick={() => onSave({ code, teacher, room, colSpan })}>Save</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}