import type { Day, Period, Timetable, RoutineCell, Subject } from '../types'

export const DAYS: readonly Day[] = ['SUN', 'MON', 'TUE', 'WED', 'THU'] as const

export const DAY_LABELS: Record<Day, string> = {
  SUN: 'Sunday', MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday',
}

export const PERIODS: readonly Period[] = [
  { id: '1', label: '1st', time: '08:00 - 08:45' },
  { id: '2', label: '2nd', time: '08:45 - 09:30' },
  { id: '3', label: '3rd', time: '09:30 - 10:15' },
  { id: '4', label: '4th', time: '10:15 - 11:00' },
  { id: '5', label: '5th', time: '11:00 - 11:45' },
  { id: '6', label: '6th', time: '11:45 - 12:30' },
  { id: '7', label: '7th', time: '12:30 - 01:15' },
]

const cell = (code: string, teacher: string, room: string, colSpan: number = 1): RoutineCell => ({ code, teacher, room, colSpan })

export const DEFAULT_TIMETABLE: Timetable = {
  periods: [...PERIODS],
  grid: {
    SUN: { 
      '1': cell('25931', 'AKB-R', 'COM-308', 2),
      '3': cell('28531', 'AL', 'COM-302'),
      '4': cell('28533', 'YA', 'COM-302'),
      '5': cell('26831', 'SR', 'DE Lab', 3)
    },
    MON: { 
      '1': cell('28533', 'YA', 'Hardware Lab', 3),
      '4': cell('25811', 'MOA', 'COM-302'),
      '5': cell('25922', 'RS-2', 'Chemistry Lab', 3)
    },
    TUE: { 
      '1': cell('28532', 'RD', 'Software Lab', 3),
      '4': cell('25922', 'RS-2', 'COM-303'),
      '5': cell('28531', 'AL', 'Software Lab', 3)
    },
    WED: { 
      '1': cell('25931', 'AKB-R', 'COM-308', 2),
      '3': cell('26831', 'SR', 'COM-308'),
      '4': cell('28531', 'AL', 'COM-308'),
      '5': cell('25811', 'MOA', 'COM-308'),
      '6': cell('25922', 'RS-2', 'COM-308'),
      '7': cell('28533', 'YA', 'COM-308')
    },
    THU: { 
      '1': cell('28533', 'YA', 'Hardware Lab', 3),
      '4': cell('25931', 'AKB-R', 'COM-308', 2),
      '6': cell('25922', 'RS-2', 'COM-308'),
      '7': cell('26831', 'SR', 'COM-308')
    },
  },
}

export const SEED_SUBJECTS: Subject[] = [
  { id: 'sub-1', code: '25811', name: 'Social Science', teacherName: 'Md. Ohidul Ali', teacherInitial: 'MOA', room: 'COM-302', description: 'Social Science' },
  { id: 'sub-2', code: '25922', name: 'Physics-II', teacherName: 'R. Sultana', teacherInitial: 'RS-2', room: 'COM-303', description: 'Physics-II' },
  { id: 'sub-3', code: '25931', name: 'Mathematics-III', teacherName: 'Md. A. K. B. Rahman', teacherInitial: 'AKB-R', room: 'COM-308', description: 'Mathematics-III' },
  { id: 'sub-4', code: '28531', name: 'Application Development', teacherName: 'Abdul Latif', teacherInitial: 'AL', room: 'COM-302', description: 'App Development' },
  { id: 'sub-5', code: '28532', name: 'Computer Graphics Design-II', teacherName: 'Rasedul Islam', teacherInitial: 'RD', room: 'Software Lab', description: 'Graphics Design' },
  { id: 'sub-6', code: '28533', name: 'IT Support Services', teacherName: 'Yasir Arafat', teacherInitial: 'YA', room: 'Hardware Lab', description: 'IT Support' },
  { id: 'sub-7', code: '26831', name: 'Digital Electronics-I', teacherName: 'S. Rahman', teacherInitial: 'SR', room: 'DE Lab', description: 'Digital Electronics' },
]

const PALETTE = [
  'bg-sky-50 text-sky-800 border-sky-200',
  'bg-teal-50 text-teal-800 border-teal-200',
  'bg-violet-50 text-violet-800 border-violet-200',
  'bg-amber-50 text-amber-800 border-amber-200',
  'bg-rose-50 text-rose-800 border-rose-200',
  'bg-emerald-50 text-emerald-800 border-emerald-200',
  'bg-indigo-50 text-indigo-800 border-indigo-200',
] as const

export function colorFor(code: string): string {
  let h = 0
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}