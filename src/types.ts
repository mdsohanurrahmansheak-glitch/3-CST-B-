import type { Timestamp } from 'firebase/firestore'

export type Role = 'cr' | 'student'

export interface User {
  uid: string
  name: string
  roll: string
  email: string
  contact: string
  role: Role
  photoURL?: string
  createdAt: number | Timestamp | null
}

export interface Period { id: string; label: string; time: string }

// RoutineCell এ colSpan যুক্ত করা হলো
export interface RoutineCell {
  code: string
  teacher: string
  room: string
  colSpan?: number
}

export type Day = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU'

export interface Timetable {
  periods: Period[]
  grid: Partial<Record<Day, Partial<Record<string, RoutineCell>>>>
}

export interface RoutineDoc {
  timetable: Timetable
  officialImageURL: string
  lastUpdatedBy?: string
  lastUpdatedAt?: number | Timestamp | null
}

export interface Subject {
  id: string
  code: string
  name: string
  teacherName: string
  teacherInitial: string
  room: string
  description: string
  createdBy?: string
}

export interface ClassHistoryEntry {
  id?: string
  subjectCode: string
  date: string
  topic: string
  presentCount: number
  note?: string
}

export type NoteType = 'PDF' | 'Doc' | 'Link' | 'Video'

export interface Note {
  id: string
  title: string
  subjectCode: string
  type: NoteType
  url: string
  description: string
  uploadedBy: string
  createdAt: number | Timestamp | null
}

export interface NoteForm {
  title: string
  subjectCode: string
  type: NoteType
  url: string
  description: string
}

export type Channel = 'general' | 'important'

export interface Message {
  id: string
  text: string
  senderId: string
  senderName: string
  channel: Channel
  timestamp: number
}

export type NoticeType = 'Exam' | 'Holiday' | 'General' | 'Urgent'

export interface Notice {
  id: string
  title: string
  type: NoticeType
  description: string
  createdBy: string
  createdAt: number | Timestamp | null
}

export interface RegisterPayload {
  name: string
  roll: string
  email: string
  contact: string
  password: string
}

export interface PasswordUpdatePayload {
  email: string
  currentPassword: string
  newPassword: string
}

export type PageId = 'dashboard' | 'routine' | 'subjects' | 'notes' | 'members' | 'chat' | 'notices' | 'settings'

export interface ToastMsg {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}