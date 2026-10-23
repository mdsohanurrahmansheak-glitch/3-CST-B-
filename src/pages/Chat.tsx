import { useEffect, useMemo, useRef, useState } from 'react'
import { Hash, Lock, Send, ShieldAlert } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Avatar, Badge, Button, Card, Spinner } from '../components/ui'
import type { Channel, Message, User } from '../types'

export default function Chat() {
  const { user, isCR } = useAuth()
  const { toast } = useToast()
  const [channel, setChannel] = useState<Channel>('general')
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = api.subscribeMessages(setMessages)
    api.listUsers().then(setMembers)
    return () => unsub()
  }, [])

  const visible = useMemo(() => (messages ?? []).filter((m) => m.channel === channel), [messages, channel])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [visible.length])

  async function send() {
    if (!user || !text.trim()) return
    if (channel === 'important' && !isCR) {
      toast('Only CR can post in #important', 'error'); return
    }
    await api.sendMessage({ text: text.trim(), senderId: user.uid, senderName: user.name, channel })
    setText('')
  }

  if (!messages) return <Spinner />

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <Card className="flex h-[calc(100vh-10rem)] flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <button onClick={() => setChannel('general')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${channel === 'general' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Hash size={13} /> general
          </button>
          <button onClick={() => setChannel('important')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${channel === 'important' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Lock size={13} /> important
          </button>
          {channel === 'important' && !isCR && (
            <Badge tone="rose"><ShieldAlert size={10} /> Read-only</Badge>
          )}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {visible.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">No messages yet. Be the first to say hi 👋</p>
          )}
          {visible.map((m) => {
            const mine = m.senderId === user?.uid
            return (
              <div key={m.id} className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                <Avatar name={m.senderName} size="sm" />
                <div className={`max-w-[75%] ${mine ? 'text-right' : ''}`}>
                  <p className="mb-0.5 text-[10px] font-semibold text-slate-500">
                    {m.senderName} · {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className={`inline-block rounded-2xl px-3.5 py-2 text-sm ${mine ? 'bg-accent text-white' : 'bg-slate-100 text-slate-800'}`}>
                    {m.text}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-100 p-3">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={channel === 'important' && !isCR ? 'Only CR can post here' : `Message #${channel}…`}
              disabled={channel === 'important' && !isCR}
              className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 disabled:bg-slate-50"
            />
            <Button variant="accent" onClick={send} disabled={!text.trim() || (channel === 'important' && !isCR)}>
              <Send size={15} />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="hidden h-[calc(100vh-10rem)] overflow-y-auto p-4 lg:block">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Online Members</p>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.uid} className="flex items-center gap-2 rounded-lg px-1 py-1.5">
              <div className="relative">
                <Avatar name={m.name} size="sm" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-primary">{m.name}</p>
                <p className="truncate text-[10px] text-slate-400">{m.role === 'cr' ? 'Class Representative' : `Roll ${m.roll}`}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}