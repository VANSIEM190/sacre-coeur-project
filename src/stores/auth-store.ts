import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AnyUser, RegisterParentUser, TeacherUser } from '@/lib/types'

// IMPORTATION DES SERVICES CENTRALISÉS
import {
  parentService,
  type RegisterParentInput,
} from '@/services/parent/parent.service'
import { authService, type UserRole } from '@/services/auth/auth.service'
import { teacherService } from '@/services/teacher/teacher.service'

interface AuthState {
  currentUser: AnyUser | null
  registeredUsers: Omit<AnyUser, 'password'>[] // Sécurité : On exclut le mot de passe du store
  theme: 'light' | 'dark'

  login: (
    email: string,
    password: string,
    expectedRole: UserRole
  ) => Promise<{ ok: boolean; role?: UserRole; error?: string }>

  registerParent: (
    data: Omit<
      RegisterParentUser,
      'id' | 'role' | 'isValidatedByAdmin' | 'createdAt' | 'password'
    > & { password?: string }
  ) => Promise<{ ok: boolean; error?: string }>

  createTeacher: (
    data: Omit<TeacherUser, 'id' | 'role' | 'createdAt' | 'teacherAccessId'>
  ) => Promise<{ ok: boolean; error?: string }>

  updateUserInStore: (id: string, updates: Partial<AnyUser>) => void
  removeUser: (id: string) => void
  logout: () => Promise<void>
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      registeredUsers: [],
      theme: 'light',

      login: async (email, password, expectedRole) => {
        try {
          if (!email || !password) {
            return { ok: false, error: 'Veuillez remplir tous les champs.' }
          }

          // 1. Authentification globale avec validation stricte du rôle attendu côté serveur/Supabase
          const { user, role } = await authService.login(
            email,
            password,
            expectedRole as UserRole
          )

          if (!user) {
            return {
              ok: false,
              error: 'Impossible de récupérer les données utilisateur.',
            }
          }

          // Construction de la session de base
          let userSession: AnyUser = {
            id: user.id,
            email: user.email ?? email,
            role: role,
            fullName: user.user_metadata?.fullName ?? email.split('@')[0],
            createdAt: user.created_at,
          } as AnyUser

          // 2. Si Enseignant : Récupération des détails via le Service dédié
          if (role === 'teacher') {
            try {
              const teacherData = (await teacherService.getDetailsByEmail(
                user.email ?? email
              )) as TeacherUser | null

              if (teacherData) {
                userSession = {
                  ...userSession,
                  fullName: teacherData.fullName || userSession.fullName,
                  teacherAccessId: teacherData.teacherAccessId,
                  assignedclasses: teacherData.assignedclasses || [],
                } as TeacherUser
              }
            } catch (teacherError) {
              console.error(
                'Erreur détails enseignant lors du login:',
                teacherError
              )
            }
          }

          set({ currentUser: userSession })
          return { ok: true, role }
        } catch (err: unknown) {
          return {
            ok: false,
            error:
              err instanceof Error
                ? err.message
                : 'Une erreur est survenue lors de la connexion.',
          }
        }
      },

      registerParent: async data => {
        try {
          if (!data.password || data.password.trim() === '') {
            return {
              ok: false,
              error: "Le mot de passe est obligatoire pour l'inscription.",
            }
          }

          const registerInput: RegisterParentInput = {
            email: data.email,
            password: data.password,
            lastName: data.lastName,
            middleName: data.middleName ?? null,
            firstName: data.firstName,
            guardianRelation: data.guardianRelation,
            profession: data.profession,
            phone: data.phone,
          }

          // Appel au service (qui gère en interne la création auth et l'insertion dans la table parents)
          await parentService.register(registerInput)

          // Sécurité : On crée l'objet sans le champ password pour le state local
          const newParentRecord: Omit<RegisterParentUser, 'password'> = {
            id: crypto.randomUUID(), // Identifiant temporaire visuel pour la liste locale ou rechargé au prochain fetch
            email: data.email,
            role: 'parent',
            fullName: `${data.firstName} ${data.lastName}`.trim(),
            createdAt: new Date().toISOString(),
            lastName: data.lastName,
            middleName: data.middleName ?? '',
            firstName: data.firstName,
            guardianRelation: data.guardianRelation,
            profession: data.profession,
            phone: data.phone,
          }

          set({
            registeredUsers: [
              ...get().registeredUsers,
              newParentRecord as AnyUser,
            ],
          })
          return { ok: true }
        } catch (err) {
          return {
            ok: false,
            error:
              err instanceof Error
                ? err.message
                : "Une erreur est survenue lors de l'inscription.",
          }
        }
      },

      createTeacher: async teacherData => {
        try {
          const newTeacher = await teacherService.register(teacherData)
          console.log(newTeacher.assignedclasses)
          set({ registeredUsers: [...get().registeredUsers, newTeacher] })
          return { ok: true }
        } catch (err) {
          return {
            ok: false,
            error:
              err instanceof Error
                ? err.message
                : "Erreur lors de la création de l'enseignant.",
          }
        }
      },

      updateUserInStore: (id, updates) => {
        set({
          registeredUsers: get().registeredUsers.map(user =>
            user.id === id ? { ...user, ...updates } : user
          ),
        })
      },

      removeUser: id => {
        set({
          registeredUsers: get().registeredUsers.filter(user => user.id !== id),
        })
      },

      logout: async () => {
        try {
          await authService.logout()
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
