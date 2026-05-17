import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'

/** Applies the persisted theme to <html> on the client. */
export function useThemeEffect() {
  const theme = useAuthStore(s => s.theme)
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
}
