import { useState, type ReactNode } from 'react'
import {
  Bell, BookOpen, CalendarDays, FolderOpen, LayoutDashboard,
  LogOut, Menu, MessageSquare, Users, X, GraduationCap, Settings,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Avatar, Badge } from './ui'
import type { PageId } from '../types'

export const NAV: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'routine', label: 'Class Routine', icon: CalendarDays },
  { id: 'subjects', label: 'Subjects & Details', icon: BookOpen },
  { id: 'notes', label: 'Notes & Resources', icon: FolderOpen },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'chat', label: 'Class Chat', icon: MessageSquare },
  { id: 'notices', label: 'Notices', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
]

interface LayoutProps { page: PageId; setPage: (p: PageId) => void; children: ReactNode }

export default function Layout({ page, setPage, children }: LayoutProps) {
  const { user, isCR, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
          <GraduationCap size={20} className="text-accent" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">3/CST/B</p>
          <p className="truncate text-[10px] uppercase tracking-wider text-slate-400">JPI · CST</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {NAV.map((n) => {
          const Icon = n.icon
          const active = page === n.id
          return (
            <button
              key={n.id}
              onClick={() => { setPage(n.id); setOpen(false) }}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                active ? 'bg-accent text-white shadow-glow' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={17} className={active ? '' : 'text-slate-400 group-hover:text-accent'} />
              <span className="truncate">{n.label}</span>
            </button>
          )
        })}
      </nav>
      
      <div className="border-t border-white/10 px-4 py-4">
        <p className="text-[10px] leading-relaxed text-slate-500">
          Jashore Polytechnic Institute<br />Computer Science & Technology
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-3 px-4 sm:px-6">
          
          {/* Mobile Menu Button */}
          <button className="rounded-lg p-2 text-primary hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          
          {/* Logo & Title */}
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-primary text-white sm:flex">
              <GraduationCap size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-extrabold text-primary sm:text-base">3/CST/B — Class Management Portal</h1>
              <p className="hidden truncate text-[11px] text-slate-500 sm:block">
                Jashore Polytechnic Institute · CST · 3rd Semester · Section B · 1st Shift
              </p>
            </div>
          </div>

          {/* Right Side (Developer Credit, Profile, Logout) */}
          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            
            {/* Developed By Watermark/Text */}
            <div className="hidden md:flex flex-col items-end justify-center text-right mr-2 border-r border-slate-200 pr-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Developed by</span>
              <span className="text-xs font-extrabold text-accent">M.S.R SAJID</span>
            </div>

            {/* User Profile Box */}
            <div className="hidden items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 sm:flex">
              <Avatar name={user?.name || ''} size="sm" />
              <div className="max-w-[140px]">
                <p className="truncate text-xs font-bold text-primary">{user?.name}</p>
                <p className="truncate text-[10px] text-slate-500">Roll: {user?.roll}</p>
              </div>
              <Badge tone={isCR ? 'accent' : 'slate'}>{isCR ? 'CR · Admin' : 'Student'}</Badge>
            </div>

            {/* Logout Button */}
            <button onClick={logout} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
              <LogOut size={15} /> <span className="hidden sm:inline">Logout</span>
            </button>
            
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        {/* Desktop Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 bg-primary lg:block">
          {Sidebar}
        </aside>

        {/* Mobile Drawer */}
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="animate-slide-up absolute left-0 top-0 h-full w-72 bg-primary">
              <button className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-300 hover:bg-white/10" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
              {Sidebar}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div key={page} className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  )
}