import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot,
  orderBy, query, serverTimestamp, setDoc, updateDoc,
  type DocumentData, type Unsubscribe,
} from 'firebase/firestore'
import { auth, db, firebaseEnabled, CR_WHITELIST, CR_PASSWORD } from '../firebase'
import { DEFAULT_TIMETABLE, SEED_SUBJECTS } from '../data/defaults'
import { uploadToImgBB } from './imgbb'
import type {
  User, Timetable, RoutineDoc, Subject, ClassHistoryEntry, Note, NoteForm,
  Message, Channel, Notice, RegisterPayload, NoticeType,
} from '../types'

function requireFirebase() {
  if (!auth || !db) throw new Error('Firebase is not configured')
  return { auth, db }
}

interface DemoDB {
  users: Record<string, User>
  passwords: Record<string, string>
  session: string | null
  routine: RoutineDoc
  subjects: Subject[]
  classHistory: ClassHistoryEntry[]
  notes: Note[]
  messages: Message[]
  notices: Notice[]
}

const LS_KEY = 'jpi_cstb_portal_v3'
const wait = (ms = 150) => new Promise<void>((r) => setTimeout(r, ms))
const nid = (p = 'id') => `${p}-${Math.random().toString(36).slice(2, 9)}`

function seed(): DemoDB {
  const now = Date.now()
  return {
    users: {
      'cr-1': { uid: 'cr-1', name: 'Md. Sohanur Rahman', roll: '492001', email: 'mdsohanurrahmansheak@gmail.com', contact: '01712345678', role: 'cr', createdAt: now },
      'st-1': { uid: 'st-1', name: 'Sadia Islam', roll: '492102', email: 'sadia@student.jpi.edu', contact: '01812345678', role: 'student', createdAt: now },
    },
    passwords: {
      'mdsohanurrahmansheak@gmail.com': CR_PASSWORD,
      'sadia@student.jpi.edu': '123456',
    },
    session: null,
    routine: { timetable: DEFAULT_TIMETABLE, officialImageURL: '', lastUpdatedAt: now },
    subjects: SEED_SUBJECTS,
    classHistory: [],
    notes: [],
    messages: [],
    notices: [],
  }
}

function load(): DemoDB {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as DemoDB
  } catch { /* ignore */ }
  const s = seed()
  localStorage.setItem(LS_KEY, JSON.stringify(s))
  return s
}
const save = (d: DemoDB) => localStorage.setItem(LS_KEY, JSON.stringify(d))

const listeners = new Set<() => void>()
const broadcast = () => listeners.forEach((cb) => cb())

function toUser(uid: string, data: DocumentData): User {
  return {
    uid,
    name: String(data.name ?? ''),
    roll: String(data.roll ?? ''),
    email: String(data.email ?? ''),
    contact: String(data.contact ?? ''),
    role: data.role === 'cr' ? 'cr' : 'student',
    photoURL: data.photoURL as string | undefined,
    createdAt: data.createdAt ?? null,
  }
}

export const api = {
  firebaseEnabled,

  getSession(): User | null {
    if (firebaseEnabled) return null
    const d = load()
    return d.session ? d.users[d.session] ?? null : null
  },

  async register(payload: RegisterPayload): Promise<User> {
    if (firebaseEnabled) {
      const { auth: A, db: D } = requireFirebase()
      const cred = await createUserWithEmailAndPassword(A, payload.email, payload.password)
      const docData = {
        name: payload.name, roll: payload.roll, email: payload.email,
        contact: payload.contact, role: 'student' as const,
        photoURL: '', createdAt: serverTimestamp(),
      }
      await setDoc(doc(D, 'users', cred.user.uid), docData)
      return { uid: cred.user.uid, ...docData, createdAt: Date.now() }
    }
    await wait()
    const d = load()
    if (Object.values(d.users).some((u) => u.email.toLowerCase() === payload.email.toLowerCase()))
      throw new Error('An account with this email already exists.')
    const id = nid('u')
    const user: User = { uid: id, name: payload.name, roll: payload.roll, email: payload.email, contact: payload.contact, role: 'student', createdAt: Date.now() }
    d.users[id] = user
    d.passwords[payload.email.toLowerCase()] = payload.password
    d.session = id
    save(d)
    return user
  },

  async login(email: string, password: string): Promise<User> {
    if (firebaseEnabled) {
      const { auth: A, db: D } = requireFirebase()
      const cred = await signInWithEmailAndPassword(A, email, password)
      const snap = await getDoc(doc(D, 'users', cred.user.uid))
      if (!snap.exists()) throw new Error('Profile not found. Contact your CR.')
      return toUser(cred.user.uid, snap.data())
    }
    await wait()
    const d = load()
    const found = Object.values(d.users).find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!found) throw new Error('No account found with this email.')
    if (d.passwords[email.toLowerCase()] !== password) throw new Error('Incorrect password.')
    d.session = found.uid
    save(d)
    return found
  },

  async loginCR(email: string, password: string): Promise<User> {
    if (firebaseEnabled) {
      const { auth: A, db: D } = requireFirebase()
      
      if (!CR_WHITELIST.includes(email.toLowerCase())) {
        throw new Error('You are not authorized as CR. This email is not in the CR whitelist.')
      }

      const cred = await signInWithEmailAndPassword(A, email, password)
      const snap = await getDoc(doc(D, 'users', cred.user.uid))
      
      let profile: User
      if (snap.exists()) {
        profile = { ...toUser(cred.user.uid, snap.data()), role: 'cr' as const }
      } else {
        profile = {
          uid: cred.user.uid,
          name: 'Class Representative',
          roll: 'CR',
          email: email,
          contact: '',
          role: 'cr',
          createdAt: Date.now()
        }
      }
      
      await setDoc(doc(D, 'users', cred.user.uid), profile, { merge: true })
      return profile
    }
    
    await wait()
    if (!CR_WHITELIST.includes(email.toLowerCase())) throw new Error('You are not authorized as CR')
    if (password !== CR_PASSWORD) throw new Error('Invalid CR password.')
    const d = load()
    let cr = Object.values(d.users).find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!cr) {
      const id = nid('u')
      cr = { uid: id, name: 'Md. Sohanur Rahman', roll: 'CR', email, contact: '', role: 'cr', createdAt: Date.now() }
      d.users[id] = cr
      d.passwords[email.toLowerCase()] = CR_PASSWORD
    }
    cr.role = 'cr'
    d.session = cr.uid
    save(d)
    return cr
  },

  async logout(): Promise<void> {
    if (firebaseEnabled) { const { auth: A } = requireFirebase(); await signOut(A); return }
    const d = load(); d.session = null; save(d)
  },

  async updateCRPassword(currentPassword: string, newPassword: string): Promise<void> {
    if (firebaseEnabled) {
      const { auth: A } = requireFirebase()
      if (!A.currentUser || !A.currentUser.email) throw new Error('You must be logged in.')
      const credential = EmailAuthProvider.credential(A.currentUser.email, currentPassword)
      await reauthenticateWithCredential(A.currentUser, credential)
      await updatePassword(A.currentUser, newPassword)
      return
    }
    const d = load()
    const crEmail = CR_WHITELIST[0]
    if (d.passwords[crEmail] !== currentPassword) {
      throw new Error('Incorrect current password.')
    }
    d.passwords[crEmail] = newPassword
    save(d)
  },

  async listUsers(): Promise<User[]> {
    if (firebaseEnabled) {
      const { db: D } = requireFirebase()
      const snap = await getDocs(collection(D, 'users'))
      return snap.docs.map((x) => toUser(x.id, x.data()))
    }
    await wait(100)
    return Object.values(load().users).sort((a, b) =>
      a.role === 'cr' ? -1 : b.role === 'cr' ? 1 : a.name.localeCompare(b.name))
  },

  async addStudent(p: Omit<RegisterPayload, 'password'>): Promise<User> {
    if (firebaseEnabled) {
      const { db: D } = requireFirebase()
      const payload = { ...p, role: 'student' as const, photoURL: '', createdAt: serverTimestamp(), addedByCR: true }
      const r = await addDoc(collection(D, 'users'), payload)
      return { uid: r.id, ...payload, createdAt: Date.now() }
    }
    await wait()
    const d = load()
    const id = nid('u')
    d.users[id] = { uid: id, ...p, role: 'student', createdAt: Date.now() }
    save(d)
    return d.users[id]
  },

  async getRoutine(): Promise<RoutineDoc> {
    if (firebaseEnabled) {
      const { db: D } = requireFirebase()
      const snap = await getDoc(doc(D, 'routines', 'weekly'))
      if (!snap.exists()) return { timetable: DEFAULT_TIMETABLE, officialImageURL: '' }
      const data = snap.data()
      return {
        timetable: (data.timetable as Timetable) ?? DEFAULT_TIMETABLE,
        officialImageURL: String(data.officialImageURL ?? ''),
      }
    }
    await wait(100)
    return load().routine
  },

  async saveRoutine(timetable: Timetable, uid: string): Promise<void> {
    if (firebaseEnabled) {
      const { db: D } = requireFirebase()
      await setDoc(doc(D, 'routines', 'weekly'), {
        timetable, lastUpdatedBy: uid, lastUpdatedAt: serverTimestamp(),
      }, { merge: true })
      return
    }
    await wait()
    const d = load()
    d.routine = { ...d.routine, timetable, lastUpdatedAt: Date.now() }
    save(d)
  },

  async uploadRoutineImage(file: File): Promise<string> {
    if (firebaseEnabled) {
      const url = await uploadToImgBB(file)
      const { db: D } = requireFirebase()
      await setDoc(doc(D, 'routines', 'weekly'), {
        officialImageURL: url, lastUpdatedAt: serverTimestamp(),
      }, { merge: true })
      return url
    }
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const d = load()
        d.routine.officialImageURL = String(reader.result)
        save(d)
        resolve(String(reader.result))
      }
      reader.readAsDataURL(file)
    })
  },

  async listSubjects(): Promise<Subject[]> {
    if (firebaseEnabled) {
      const { db: D } = requireFirebase()
      const snap = await getDocs(collection(D, 'subjects'))
      
      // ডেটাবেস খালি থাকলে ডিফল্ট সাবজেক্টগুলো অটো সেভ করবে
      if (snap.empty) {
        for (const sub of SEED_SUBJECTS) {
          await setDoc(doc(D, 'subjects', sub.id), sub)
        }
        return SEED_SUBJECTS
      }
      
      return snap.docs.map((x) => ({ id: x.id, ...(x.data() as Omit<Subject, 'id'>) }))
    }
    await wait(100)
    return load().subjects
  },

  async saveSubject(subject: Omit<Subject, 'id'> & { id?: string }, uid: string): Promise<Subject> {
    if (firebaseEnabled) {
      const { db: D } = requireFirebase()
      if (subject.id) {
        await updateDoc(doc(D, 'subjects', subject.id), { ...subject })
        return subject as Subject
      }
      const r = await addDoc(collection(D, 'subjects'), { ...subject, createdBy: uid, createdAt: serverTimestamp() })
      return { id: r.id, ...subject } as Subject
    }
    await wait()
    const d = load()
    if (subject.id) {
      d.subjects = d.subjects.map((s) => (s.id === subject.id ? { ...s, ...subject } as Subject : s))
    } else {
      d.subjects.push({ ...subject, id: nid('sub') } as Subject)
    }
    save(d)
    return subject as Subject
  },

  async deleteSubject(id: string): Promise<void> {
    if (firebaseEnabled) { const { db: D } = requireFirebase(); await deleteDoc(doc(D, 'subjects', id)); return }
    await wait(); const d = load()
    d.subjects = d.subjects.filter((s) => s.id !== id); save(d)
  },

  async listHistory(): Promise<ClassHistoryEntry[]> {
    if (firebaseEnabled) {
      const { db: D } = requireFirebase()
      const snap = await getDocs(query(collection(D, 'classHistory'), orderBy('date', 'desc')))
      return snap.docs.map((x) => ({ id: x.id, ...(x.data() as Omit<ClassHistoryEntry, 'id'>) }))
    }
    await wait(100)
    return [...load().classHistory].sort((a, b) => b.date.localeCompare(a.date))
  },

  async addHistory(entry: ClassHistoryEntry): Promise<ClassHistoryEntry> {
    if (firebaseEnabled) {
      const { db: D } = requireFirebase()
      const r = await addDoc(collection(D, 'classHistory'), { ...entry, createdAt: serverTimestamp() })
      return { id: r.id, ...entry }
    }
    await wait(); const d = load()
    const created = { ...entry, id: nid('h') }
    d.classHistory.push(created); save(d); return created
  },

  async listNotes(): Promise<Note[]> {
    if (firebaseEnabled) {
      const { db: D } = requireFirebase()
      const snap = await getDocs(collection(D, 'notes'))
      return snap.docs
        .map((x) => ({ id: x.id, ...(x.data() as Omit<Note, 'id'>) }))
        .sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0))
    }
    await wait(100)
    return [...load().notes].sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
  },

  async addNote(form: NoteForm, uid: string, file: File | null): Promise<Note> {
    let url = form.url
    if (file && firebaseEnabled) {
      url = await uploadToImgBB(file)
    } else if (file) {
      url = await new Promise<string>((res) => {
        const rd = new FileReader()
        rd.onload = () => res(String(rd.result))
        rd.readAsDataURL(file)
      })
    }
    const payload = { ...form, url, uploadedBy: uid }
    if (firebaseEnabled) {
      const { db: D } = requireFirebase()
      const r = await addDoc(collection(D, 'notes'), { ...payload, createdAt: serverTimestamp() })
      return { id: r.id, ...payload, createdAt: Date.now() }
    }
    await wait(); const d = load()
    const created: Note = { ...payload, id: nid('n'), createdAt: Date.now() }
    d.notes.push(created); save(d); return created
  },

  async deleteNote(id: string): Promise<void> {
    if (firebaseEnabled) { const { db: D } = requireFirebase(); await deleteDoc(doc(D, 'notes', id)); return }
    await wait(); const d = load()
    d.notes = d.notes.filter((n) => n.id !== id); save(d)
  },

  subscribeMessages(cb: (msgs: Message[]) => void): Unsubscribe {
    if (firebaseEnabled) {
      const { db: D } = requireFirebase()
      const q = query(collection(D, 'messages'), orderBy('timestamp', 'asc'))
      return onSnapshot(q, (snap) => {
        cb(snap.docs.map((x) => {
          const data = x.data()
          return {
            id: x.id,
            text: String(data.text ?? ''),
            senderId: String(data.senderId ?? ''),
            senderName: String(data.senderName ?? ''),
            channel: (data.channel === 'important' ? 'important' : 'general') as Channel,
            timestamp: data.timestamp?.toMillis?.() ?? Date.now(),
          }
        }))
      }) as Unsubscribe
    }
    const emit = () => cb([...load().messages].sort((a, b) => a.timestamp - b.timestamp))
    listeners.add(emit)
    emit()
    return () => { listeners.delete(emit) }
  },

  async sendMessage(p: { text: string; senderId: string; senderName: string; channel: Channel }): Promise<void> {
    if (firebaseEnabled) {
      const { db: D } = requireFirebase()
      await addDoc(collection(D, 'messages'), { ...p, timestamp: serverTimestamp() })
      return
    }
    const d = load()
    d.messages.push({ ...p, id: nid('m'), timestamp: Date.now() })
    save(d); broadcast()
  },

  async listNotices(): Promise<Notice[]> {
    if (firebaseEnabled) {
      const { db: D } = requireFirebase()
      const snap = await getDocs(collection(D, 'notices'))
      return snap.docs
        .map((x) => ({ id: x.id, ...(x.data() as Omit<Notice, 'id'>) }))
        .sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0))
    }
    await wait(100)
    return [...load().notices].sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
  },

  async addNotice(p: { title: string; type: NoticeType; description: string }, uid: string): Promise<Notice> {
    if (firebaseEnabled) {
      const { db: D } = requireFirebase()
      const r = await addDoc(collection(D, 'notices'), { ...p, createdBy: uid, createdAt: serverTimestamp() })
      return { id: r.id, ...p, createdBy: uid, createdAt: Date.now() }
    }
    await wait(); const d = load()
    const created: Notice = { ...p, id: nid('no'), createdBy: uid, createdAt: Date.now() }
    d.notices.push(created); save(d); return created
  },

  async deleteNotice(id: string): Promise<void> {
    if (firebaseEnabled) { const { db: D } = requireFirebase(); await deleteDoc(doc(D, 'notices', id)); return }
    await wait(); const d = load()
    d.notices = d.notices.filter((n) => n.id !== id); save(d)
  },
}