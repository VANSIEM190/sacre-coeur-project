import { useState, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@sacre-coeur/ui/components/sonner'
import { useThemeEffect } from '@sacre-coeur/ui/hooks/use-theme-effect'
import { AuthProvider } from '@sacre-coeur/auth/providers/AuthProvider'
import type { UserRole } from '@sacre-coeur/domain/types'

export function ApplicationProviders({ allowedRoles, children }: { allowedRoles: readonly UserRole[]; children: ReactNode }) {
  const [client] = useState(() => new QueryClient())
  useThemeEffect()
  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <AuthProvider allowedRoles={allowedRoles}>{children}</AuthProvider>
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

