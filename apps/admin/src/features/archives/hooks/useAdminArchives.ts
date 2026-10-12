import { useQueryClient } from '@tanstack/react-query'
import { useFetchData, useMutateData } from '@sacre-coeur/data-access/hooks/useQuery'
import { adminArchivesServices } from '@sacre-coeur/data-access/services/archive/archive.service'
import type { ArchiveDocumentInput, ArchiveDocumentUpdateInput } from '@sacre-coeur/domain/types'
import { SupabaseErrorHandler } from '@sacre-coeur/school-features/feedback/supabase-error-handler'

export function useAdminArchives() {
  const queryClient = useQueryClient()
  const archivesQuery = useFetchData(['archives'], () => adminArchivesServices.getArchives())
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['archives'] })
  const createMutation = useMutateData((values: ArchiveDocumentInput) => adminArchivesServices.createArchive(values), {
    onSuccess: invalidate,
    onError: error => SupabaseErrorHandler.handle(error),
  })
  const updateMutation = useMutateData(({ id, values }: { id: string; values: ArchiveDocumentUpdateInput }) => adminArchivesServices.updateArchive(id, values), {
    onSuccess: invalidate,
    onError: error => SupabaseErrorHandler.handle(error),
  })
  const deleteMutation = useMutateData((payload: { archiveId: string; filePath: string }) => adminArchivesServices.deleteArchive(payload), {
    onSuccess: invalidate,
    onError: error => SupabaseErrorHandler.handle(error),
  })
  return { archivesQuery, createMutation, updateMutation, deleteMutation }
}
