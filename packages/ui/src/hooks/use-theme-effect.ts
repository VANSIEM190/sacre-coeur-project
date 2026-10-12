import { useEffect } from 'react'
import { usePreferencesStore } from '../stores/preferences-store'

/** Applies the persisted theme to <html> on the client. */
export function useThemeEffect() {
  const theme = usePreferencesStore(s => s.theme)
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
}
