// @/stores/auth-store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AnyUser, StudentUser } from '@/lib/types'
import { seedAdmin, seedTeachers, seedStudents } from '@/lib/mock-seed'
// IMPORTATION DU SERVICE SUPABASE
import { studentService } from '@/services/StudentServices'

interface AuthState {
  currentUser: AnyUser | null
  registeredUsers: AnyUser[]
  theme: 'light' | 'dark'
  // ... autres méthodes de login ...

  // Devient une fonction asynchrone retournant une promesse
  registerStudent: (
    student: Omit<
      StudentUser,
      'id' | 'role' | 'isValidatedByAdmin' | 'createdAt'
    > & { password?: string }
  ) => Promise<{ ok: boolean; error?: string }>

  logout: () => void
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

      // ... conserve tes méthodes loginAsAdmin, loginAsTeacher, loginAsStudent ici ...

      registerStudent: async data => {
        try {
          const supabaseUser = await studentService.register(data)

          if (!supabaseUser) {
            return { ok: false, error: "L'utilisateur n'a pas pu être créé." }
          }

          const newStudent: StudentUser = {
            ...data,
            id: supabaseUser.id,
            role: 'student',
            isValidatedByAdmin: false,
            createdAt: new Date().toISOString(),
          }

          set({ registeredUsers: [...get().registeredUsers, newStudent] })

          return { ok: true }
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Une erreur est survenue lors de l'inscription."

          return {
            ok: false,
            error: errorMessage,
          }
        }
      },

      logout: () => set({ currentUser: null }),
      setTheme: theme => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    {
      name: 'sacre-coeur-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : (sessionStorage as any)
      ),
    }
  )
)
