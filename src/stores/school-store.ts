import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Announcement,
  Course,
  ScheduleEntry,
  GradingSheet,
  ArchiveDocument,
  AnnualHonorRoll,
  PaymentReceipt,
} from '@/lib/types'
import {
  seedAnnouncements,
  seedCourses,
  seedSchedule,
  seedGradingSheets,
  seedArchives,
  seedHonorRolls,
  seedReceipts,
} from '@/lib/mock-seed'

const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

interface SchoolState {
  announcements: Announcement[]
  courses: Course[]
  schedule: ScheduleEntry[]
  gradingSheets: GradingSheet[]
  archives: ArchiveDocument[]
  honorRolls: AnnualHonorRoll[]
  receipts: PaymentReceipt[]

  createAnnouncement: (
    a: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>
  ) => void
  updateAnnouncement: (id: string, patch: Partial<Announcement>) => void
  deleteAnnouncement: (id: string) => void

  createCourse: (c: Omit<Course, 'id' | 'uploadedAt'>) => void
  updateCourse: (id: string, patch: Partial<Course>) => void
  deleteCourse: (id: string) => void

  createScheduleEntry: (s: Omit<ScheduleEntry, 'id'>) => void
  updateScheduleEntry: (id: string, patch: Partial<ScheduleEntry>) => void
  deleteScheduleEntry: (id: string) => void

  submitGradingSheet: (g: Omit<GradingSheet, 'id' | 'submittedAt'>) => void

  createArchive: (a: Omit<ArchiveDocument, 'id' | 'createdAt'>) => void
  updateArchive: (id: string, patch: Partial<ArchiveDocument>) => void
  deleteArchive: (id: string) => void

  createHonorRoll: (h: Omit<AnnualHonorRoll, 'id' | 'createdAt'>) => void
  deleteHonorRoll: (id: string) => void

  createReceipt: (
    r: Omit<PaymentReceipt, 'id' | 'receiptNumber' | 'paidAt'>
  ) => void
}

export const useSchoolStore = create<SchoolState>()(
  persist(
    (set, get) => ({
      announcements: seedAnnouncements,
      courses: seedCourses,
      schedule: seedSchedule,
      gradingSheets: seedGradingSheets,
      archives: seedArchives,
      honorRolls: seedHonorRolls,
      receipts: seedReceipts,

      createAnnouncement: a => {
        const now = new Date().toISOString()
        set({
          announcements: [
            { ...a, id: generateId('a'), createdAt: now, updatedAt: now },
            ...get().announcements,
          ],
        })
      },
      updateAnnouncement: (id, patch) => {
        set({
          announcements: get().announcements.map(a =>
            a.id === id
              ? { ...a, ...patch, updatedAt: new Date().toISOString() }
              : a
          ),
        })
      },
      deleteAnnouncement: id =>
        set({ announcements: get().announcements.filter(a => a.id !== id) }),

      createCourse: c =>
        set({
          courses: [
            { ...c, id: generateId('c'), uploadedAt: new Date().toISOString() },
            ...get().courses,
          ],
        }),
      updateCourse: (id, patch) =>
        set({
          courses: get().courses.map(c =>
            c.id === id ? { ...c, ...patch } : c
          ),
        }),
      deleteCourse: id =>
        set({ courses: get().courses.filter(c => c.id !== id) }),

      createScheduleEntry: s =>
        set({ schedule: [{ ...s, id: generateId('s') }, ...get().schedule] }),
      updateScheduleEntry: (id, patch) =>
        set({
          schedule: get().schedule.map(s =>
            s.id === id ? { ...s, ...patch } : s
          ),
        }),
      deleteScheduleEntry: id =>
        set({ schedule: get().schedule.filter(s => s.id !== id) }),

      submitGradingSheet: g =>
        set({
          gradingSheets: [
            {
              ...g,
              id: generateId('g'),
              submittedAt: new Date().toISOString(),
            },
            ...get().gradingSheets,
          ],
        }),

      createArchive: a =>
        set({
          archives: [
            { ...a, id: generateId('ar'), createdAt: new Date().toISOString() },
            ...get().archives,
          ],
        }),
      updateArchive: (id, patch) =>
        set({
          archives: get().archives.map(a =>
            a.id === id ? { ...a, ...patch } : a
          ),
        }),
      deleteArchive: id =>
        set({ archives: get().archives.filter(a => a.id !== id) }),

      createHonorRoll: h =>
        set({
          honorRolls: [
            { ...h, id: generateId('hr'), createdAt: new Date().toISOString() },
            ...get().honorRolls,
          ],
        }),
      deleteHonorRoll: id =>
        set({ honorRolls: get().honorRolls.filter(h => h.id !== id) }),

      createReceipt: r => {
        const num = `REC-${new Date().getFullYear()}-${String(get().receipts.length + 1).padStart(4, '0')}`
        set({
          receipts: [
            {
              ...r,
              id: generateId('r'),
              receiptNumber: num,
              paidAt: new Date().toISOString(),
            },
            ...get().receipts,
          ],
        })
      },
    }),
    {
      name: 'sacre-coeur-school',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : ({
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            } as unknown as Storage)
      ),
    }
  )
)
