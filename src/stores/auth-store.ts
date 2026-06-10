// @/stores/auth-store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AnyUser, StudentUser } from '@/lib/types'
import { seedAdmin, seedTeachers, seedStudents } from '@/lib/mock-seed'
// IMPORTATION DES SERVICES SUPABASE
import {
  studentService,
  type RegisterStudentInput,
} from '@/services/StudentServices'
import { authServices, type UserRole } from '@/services/AuthServices'

interface AuthState {
  currentUser: AnyUser | null
  registeredUsers: AnyUser[]
  theme: 'light' | 'dark'

  // Fonction de login unifiée retournant une promesse avec le statut et le rôle
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; role?: UserRole; error?: string }>

  registerStudent: (
    data: Omit<
      StudentUser,
      'id' | 'role' | 'isValidatedByAdmin' | 'createdAt'
    > & { password?: string }
  ) => Promise<{ ok: boolean; error?: string }>

  logout: () => Promise<void>
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

      login: async (email, password) => {
        try {
          if (!email || !password) {
            return { ok: false, error: 'Veuillez remplir tous les champs.' }
          }

          // 2. Appel au service d'authentification centralisé
          const { user, role } = await authServices.login(email, password)

          if (!user) {
            return {
              ok: false,
              error: 'Impossible de récupérer les données utilisateur.',
            }
          }

          const userSession: AnyUser = {
            id: user.id,
            email: user.email ?? email,
            role: role,
            fullName: user.user_metadata?.fullName ?? email.split('@')[0],
            createdAt: user.created_at,
          } as AnyUser

          set({ currentUser: userSession })

          return { ok: true, role }
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : 'Une erreur est survenue lors de la connexion.'

          return {
            ok: false,
            error: errorMessage,
          }
        }
      },

      registerStudent: async data => {
        try {
          if (!data.password || data.password.trim() === '') {
            return {
              ok: false,
              error: "Le mot de passe est obligatoire pour l'inscription.",
            }
          }

          const registerInput: RegisterStudentInput = {
            ...data,
            password: data.password,
            middleName: data.middleName ?? null,
            childMedicalCondition: data.childMedicalCondition ?? null,
          }

          const supabaseUser = await studentService.register(registerInput)

          if (!supabaseUser) {
            return {
              ok: false,
              error: "L'utilisateur n'a pas pu être créé côté serveur.",
            }
          }

          const newStudent: StudentUser = {
            id: supabaseUser.id,
            email: data.email,
            role: 'student',
            fullName: `${data.firstName} ${data.lastName}`.trim(),
            createdAt: new Date().toISOString(),
            isValidatedByAdmin: false,
            currentClassName: data.currentClassName,
            lastName: data.lastName,
            middleName: data.middleName ?? '',
            firstName: data.firstName,
            birthDate: data.birthDate,
            birthPlace: data.birthPlace,
            gender: data.gender,
            fatherName: data.fatherName,
            motherName: data.motherName,
            fatherProfession: data.fatherProfession,
            motherProfession: data.motherProfession,
            childMedicalCondition: data.childMedicalCondition ?? '',
            guardianRelation: data.guardianRelation,
            phone: data.phone,
            previousSchoolPercentage: data.previousSchoolPercentage,
            previousSchoolName: data.previousSchoolName,
            religion: data.religion,
            address: data.address,
            province: data.province,
          }

          set({ registeredUsers: [...get().registeredUsers, newStudent] })

          return { ok: true }
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Une erreur est survenue lors de l'inscription."

          return { ok: false, error: errorMessage }
        }
      },

      logout: async () => {
        try {
          await authServices.logout()
        } catch (error) {
          console.error('Erreur durant le logout global:', error)
        } finally {
          // On nettoie impérativement le state de l'application
          set({ currentUser: null })
        }
      },

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
