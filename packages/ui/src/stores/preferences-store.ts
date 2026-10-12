import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'
interface PreferencesState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: theme => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    { name: 'sacre-coeur-preferences', storage: createJSONStorage(() => localStorage) }
  )
)

