// @/stores/auth-store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AnyUser, StudentUser, TeacherUser } from '@/lib/types'
// IMPORTATION DES SERVICES SUPABASE
import {
  studentService,
  type RegisterStudentInput,
} from '@/services/StudentServices'
import { authServices, type UserRole } from '@/services/AuthServices'
import { teacherServices } from '@/services/TeacherServices'
import { supabase } from '@/supabase/supabaseClient'

interface AuthState {
  currentUser: AnyUser | null
  registeredUsers: AnyUser[]
  theme: 'light' | 'dark'

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

  createTeacher: (
    data: Omit<TeacherUser, 'id' | 'role' | 'createdAt' | 'teacherAccessId'>
  ) => Promise<{ ok: boolean; error?: string }>

  removeUser: (id: string) => void

  logout: () => Promise<void>
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      registeredUsers: [] as AnyUser[],
      theme: 'light',

      // Extrait mis à jour de ton @/stores/auth-store.ts

      login: async (email, password) => {
        try {
          if (!email || !password) {
            return { ok: false, error: 'Veuillez remplir tous les champs.' }
          }

          // 1. Appel au service d'authentification centralisé (Auth + Rôle depuis profiles)
          const { user, role } = await authServices.login(email, password)

          if (!user) {
            return {
              ok: false,
              error: 'Impossible de récupérer les données utilisateur.',
            }
          }

          // Base de la session utilisateur pour l'état global
          let userSession: AnyUser = {
            id: user.id,
            email: user.email ?? email,
            role: role,
            fullName: user.user_metadata?.fullName ?? email.split('@')[0],
            createdAt: user.created_at,
          } as AnyUser

          // 2. SI L'UTILISATEUR EST UN ENSEIGNANT : On va chercher ses détails par son EMAIL
          if (role === 'teacher') {
            const { data: teacherData, error: teacherError } = await supabase
              .from('enseignants_details')
              .select('*')
              .eq('email', user.email ?? email) // Liaison logique par l'email !
              .maybeSingle() // On utilise maybeSingle pour éviter de crash s'il n'a pas encore de fiche

            if (teacherError) {
              console.error(
                'Erreur récupération détails enseignant:',
                teacherError
              )
            }

            if (teacherData) {
              // On enrichit la session utilisateur avec ses données de prof issues de enseignants_details
              userSession = {
                ...userSession,
                fullName: teacherData.fullName || userSession.fullName,
                teacherAccessId: teacherData.matriculeEnseignant,
                assignedClassNames: teacherData.assignedclasses || [],
              } as TeacherUser
            }
          }

          // 3. SI L'UTILISATEUR EST UN ÉLÈVE : (Optionnel, même logique si besoin)
          if (role === 'student') {
            // Tu pourras faire la même chose ici avec la table eleves_details si nécessaire
          }

          // Mise à jour de l'état global Zustand
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
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Une erreur est survenue lors de l'inscription."

          return { ok: false, error: errorMessage }
        }
      },

      createTeacher: async teacherData => {
        try {
          const newTeacher = await teacherServices.register(teacherData)

          set({ registeredUsers: [...get().registeredUsers, newTeacher] })

          return { ok: true }
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Erreur lors de la création de l'enseignant."
          return {
            ok: false,
            error: errorMessage,
          }
        }
      },

      removeUser: id => {
        set({
          registeredUsers: get().registeredUsers.filter(user => user.id !== id),
        })
      },

      logout: async () => {
        try {
          await authServices.logout()
        } catch (error) {
          console.error('Erreur durant le logout global:', error)
        } finally {
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
        typeof window !== 'undefined' ? localStorage : sessionStorage
      ),
    }
  )
)
