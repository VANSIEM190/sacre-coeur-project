import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AnyUser, AdminUser, TeacherUser, StudentUser } from '@/lib/types'
import { seedAdmin, seedTeachers, seedStudents } from '@/lib/mock-seed'

interface AuthState {
  currentUser: AnyUser | null
  registeredUsers: AnyUser[]
  theme: 'light' | 'dark'

  loginAsAdmin: (
    email: string,
    password: string
  ) => { ok: boolean; error?: string }
  loginAsTeacher: (
    email: string,
    teacherAccessId: string
  ) => { ok: boolean; error?: string }
  loginAsStudent: (
    email: string,
    password: string
  ) => { ok: boolean; error?: string }
  registerStudent: (
    student: Omit<
      StudentUser,
      'id' | 'role' | 'isValidatedByAdmin' | 'createdAt'
    >
  ) => { ok: boolean; error?: string }
  logout: () => void

  upsertUser: (user: AnyUser) => void
  removeUser: (userId: string) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      registeredUsers: [
        seedAdmin,
        ...seedTeachers,
        ...seedStudents,
      ] as AnyUser[],
      theme: 'light',

      loginAsAdmin: email => {
        const admin = get().registeredUsers.find(
          (u): u is AdminUser => u.role === 'admin' && u.email === email
        )
        if (!admin)
          return { ok: false, error: 'Identifiants administrateur invalides.' }
        set({ currentUser: admin })
        return { ok: true }
      },

      loginAsTeacher: (email, teacherAccessId) => {
        const teacher = get().registeredUsers.find(
          (u): u is TeacherUser =>
            u.role === 'teacher' &&
            u.email === email &&
            u.teacherAccessId === teacherAccessId
        )
        if (!teacher)
          return { ok: false, error: 'Email ou ID enseignant invalide.' }
        set({ currentUser: teacher })
        return { ok: true }
      },

      loginAsStudent: email => {
        const student = get().registeredUsers.find(
          (u): u is StudentUser => u.role === 'student' && u.email === email
        )
        if (!student) return { ok: false, error: 'Compte introuvable.' }
        if (!student.isValidatedByAdmin) {
          return {
            ok: false,
            error:
              "Votre compte n'a pas encore été validé par l'administration.",
          }
        }
        set({ currentUser: student })
        return { ok: true }
      },

      registerStudent: data => {
        const exists = get().registeredUsers.some(u => u.email === data.email)
        if (exists)
          return { ok: false, error: 'Un compte avec cet email existe déjà.' }
        const newStudent: StudentUser = {
          ...data,
          id: `student-${Date.now()}`,
          role: 'student',
          isValidatedByAdmin: false,
          createdAt: new Date().toISOString(),
        }
        set({ registeredUsers: [...get().registeredUsers, newStudent] })
        return { ok: true }
      },

      logout: () => set({ currentUser: null }),

      upsertUser: user => {
        const users = get().registeredUsers
        const idx = users.findIndex(u => u.id === user.id)
        const next =
          idx >= 0
            ? users.map((u, i) => (i === idx ? user : u))
            : [...users, user]
        set({ registeredUsers: next })
        if (get().currentUser?.id === user.id) set({ currentUser: user })
      },

      removeUser: userId => {
        set({
          registeredUsers: get().registeredUsers.filter(u => u.id !== userId),
        })
      },

      setTheme: theme => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    {
      name: 'sacre-coeur-auth',
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
