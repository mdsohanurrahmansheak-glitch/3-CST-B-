import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { api } from '../lib/api'
import { auth, db, firebaseEnabled } from '../firebase'
import type { User, RegisterPayload } from '../types'

interface AuthCtxValue {
  user: User | null
  loading: boolean
  isCR: boolean
  register: (p: RegisterPayload) => Promise<User>
  login: (email: string, password: string) => Promise<User>
  loginCR: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

const AuthCtx = createContext<AuthCtxValue | null>(null)

export function useAuth(): AuthCtxValue {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (firebaseEnabled && auth && db) {
      const unsub = onAuthStateChanged(auth, async (fb) => {
        if (fb) {
          try {
            const snap = await getDoc(doc(db!, 'users', fb.uid))
            setUser(snap.exists()
              ? {
                  uid: fb.uid,
                  name: String(snap.data().name ?? ''),
                  roll: String(snap.data().roll ?? ''),
                  email: String(snap.data().email ?? fb.email ?? ''),
                  contact: String(snap.data().contact ?? ''),
                  role: snap.data().role === 'cr' ? 'cr' : 'student',
                  createdAt: snap.data().createdAt ?? null,
                }
              : { uid: fb.uid, name: fb.email ?? 'User', roll: '—', email: fb.email ?? '', contact: '', role: 'student', createdAt: null })
          } catch {
            setUser({ uid: fb.uid, name: fb.email ?? 'User', roll: '—', email: fb.email ?? '', contact: '', role: 'student', createdAt: null })
          }
        } else setUser(null)
        setLoading(false)
      })
      return () => unsub()
    }
    setUser(api.getSession())
    setLoading(false)
  }, [])

  const value: AuthCtxValue = {
    user,
    loading,
    isCR: user?.role === 'cr',
    register: async (p) => { const u = await api.register(p); setUser(u); return u },
    login: async (e, p) => { const u = await api.login(e, p); setUser(u); return u },
    loginCR: async (e, p) => { const u = await api.loginCR(e, p); setUser(u); return u },
    logout: async () => { await api.logout(); setUser(null) },
  }

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}