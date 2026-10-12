import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useFetchData, useMutateData } from '@sacre-coeur/data-access/hooks/useQuery'
import { settingsService } from '@sacre-coeur/data-access/services/settings/settings.service'
import { SupabaseErrorHandler } from '@sacre-coeur/school-features/feedback/supabase-error-handler'
import { toast } from 'sonner'
import type { SystemSettingItem } from '../types/system-setting'

export function useAdminSettingsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const settingsQuery = useFetchData<SystemSettingItem[]>(['systemSettings'], async () => [{
    key: 'reenrollment_enabled',
    label: 'Session de Réinscription',
    description: "Autorise ou bloque les formulaires de réinscription pour les élèves pendant l'année scolaire.",
    enabled: await settingsService.isReenrollmentOpen(),
  }])
  const toggleMutation = useMutateData(({ key, enabled }: { key: string; enabled: boolean }) => {
    void key
    return settingsService.setReenrollmentStatus(enabled)
  }, {
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] })
      toast.success(`Paramètre ${variables.enabled ? 'activé' : 'désactivé'} avec succès`)
    },
    onError: error => SupabaseErrorHandler.handle(error),
  })
  const createMutation = useMutateData<boolean, Error, { key: string; label: string; description: string }>(value => {
    void value
    return settingsService.setReenrollmentStatus(false)
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] })
      toast.success('Nouveau paramètre ajouté')
      closeModal()
    },
    onError: error => SupabaseErrorHandler.handle(error),
  })
  function closeModal() {
    setIsModalOpen(false)
    setNewKey('')
    setNewLabel('')
    setNewDescription('')
  }
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!newKey.trim() || !newLabel.trim()) return
    createMutation.mutate({ key: newKey.toLowerCase().replace(/\s+/g, '_'), label: newLabel, description: newDescription })
  }
  return {
    settings: settingsQuery.data ?? [], isLoading: settingsQuery.isLoading, isError: settingsQuery.isError,
    isModalOpen, newKey, newLabel, newDescription, toggleMutation, createMutation,
    setIsModalOpen, setNewKey, setNewLabel, setNewDescription, closeModal, submit,
    toggle: (key: string, enabled: boolean) => toggleMutation.mutate({ key, enabled }),
  }
}
