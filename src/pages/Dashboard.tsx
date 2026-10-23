import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck2, Megaphone, Users2, Sparkles, Clock } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Avatar, Badge, Card, SectionTitle, Spinner } from '../components/ui'
import { DAYS, DAY_LABELS, colorFor } from '../data/defaults'
import type { Day, Notice, RoutineDoc, User, PageId } from '../types'

interface Props { goto: (p: PageId) => void }

export default function Dashboard({ goto }: Props) {
  const { user, isCR } = useAuth()
  const [routine, setRoutine] = useState<RoutineDoc | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([api.getRoutine(), api.listNotices(), api.listUsers()]).then(([r, n, m]) => {
      if (!alive) return
      setRoutine(r); setNotices(n.slice(0, 3)); setMembers(m); setLoading(false)
    })
    return () => { alive = false }
  }, [])

  const dayIdx = new Date().getDay() // 0 = Sunday, 5 = Friday, 6 = Saturday
  
  // শুক্র (5) এবং শনি (6) ছুটি হিসেবে ধরা হবে
  const todayKey: Day | null = (dayIdx === 5 || dayIdx === 6) ? null : DAYS[dayIdx === 0 ? 0 : dayIdx - 1]
  const isWeekend = todayKey === null

  const todayClasses = useMemo(() => {
    if (!routine || !todayKey) return []
    const grid = routine.timetable.grid[todayKey] ?? {}
    return routine.timetable.periods
      .filter((p) => grid[p.id])
      .map((p) => ({ ...p, ...grid[p.id]! }))
  }, [routine, todayKey])

  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) return <Spinner />

  const stats = [
    { icon: Users2, label: 'Total Students', value: String(members.length), tone: 'text-sky-600 bg-sky-50' },
    { icon: CalendarCheck2, label: "Today's Classes", value: isWeekend ? 'Holiday' : String(todayClasses.length), tone: 'text-emerald-600 bg-emerald-50' },
    { icon: Clock, label: "Today's Date", value: String(new Date().getDate()), tone: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="space-y-6 relative">
      {/* M.S.R SAJID Watermark */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
        <h1 className="text-[12vw] font-black text-primary/5 select-none whitespace-nowrap rotate-[-15deg] tracking-tighter">
          M.S.R SAJID
        </h1>
      </div>

      {/* Main Content Container (z-10 ensures it stays above watermark) */}
      <div className="relative z-10 space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-[#123a6b] p-6 text-white shadow-card sm:p-8">
          <div className="absolute -right-10 -top-14 h-52 w-52 rounded-full bg-accent/25 blur-3xl" />
          <div className="relative">
            <Badge tone="accent" className="mb-3 bg-white/15 text-accent"><Sparkles size={11} /> {isCR ? 'Admin Access' : 'Student Access'}</Badge>
            <h2 className="text-xl font-extrabold sm:text-2xl">Welcome to 3/CST/B Family</h2>
            <p className="mt-1.5 max-w-lg text-sm text-slate-300">Hello <span className="font-semibold text-white">{user?.name}</span> — here is what's happening in your class today.</p>
            <p className="mt-3 text-xs font-medium text-slate-400">{dateStr} · 1st Shift</p>
          </div>
        </div>

        {/* ৩টি স্ট্যাট কার্ড */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-4 sm:p-5 bg-white/80 backdrop-blur-sm">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${s.tone}`}><s.icon size={17} /></div>
              <p className="text-xl font-extrabold text-primary sm:text-2xl">{s.value}</p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">{s.label}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2 bg-white/80 backdrop-blur-sm">
            <SectionTitle
              title={`Today's Classes — ${isWeekend ? 'Weekend' : DAY_LABELS[todayKey!]}`}
              subtitle={isWeekend ? 'Enjoy your day off 🎉' : `${todayClasses.length} scheduled period(s)`}
              right={<button onClick={() => goto('routine')} className="text-xs font-bold text-accent hover:underline">View Full Routine →</button>}
            />
            {isWeekend || todayClasses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">No classes scheduled today.</div>
            ) : (
              <div className="space-y-2.5">
                {todayClasses.map((c) => (
                  <div key={c.id} className={`flex items-center gap-3 rounded-xl border p-3 ${colorFor(c.code)}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/70 text-[11px] font-extrabold">{c.label}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{c.code} · {c.teacher}</p>
                      <p className="text-[11px] opacity-80">{c.time} · Room {c.room}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5 bg-white/80 backdrop-blur-sm">
            <SectionTitle title="Latest Notices" right={<button onClick={() => goto('notices')} className="text-xs font-bold text-accent hover:underline">All →</button>} />
            {notices.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No notices yet.</p>
            ) : (
              <div className="space-y-3">
                {notices.map((n) => (
                  <div key={n.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="mb-1 flex items-center gap-2"><Megaphone size={13} className="text-accent" /><p className="line-clamp-1 text-xs font-bold text-primary">{n.title}</p></div>
                    <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">{n.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="p-5 bg-white/80 backdrop-blur-sm">
          <SectionTitle title="Classmates" subtitle={`${members.length} registered member(s)`} right={<button onClick={() => goto('members')} className="text-xs font-bold text-accent hover:underline">All members →</button>} />
          <div className="flex flex-wrap gap-3">
            {members.slice(0, 8).map((m) => (
              <div key={m.uid} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                <Avatar name={m.name} size="sm" />
                <div>
                  <p className="text-xs font-bold text-primary">{m.name}</p>
                  <p className="text-[10px] text-slate-500">Roll {m.roll}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}