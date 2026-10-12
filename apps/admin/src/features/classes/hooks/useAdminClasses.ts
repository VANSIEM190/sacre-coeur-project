import { useFetchData, useMutateData } from '@sacre-coeur/data-access/hooks/useQuery'
import { classService } from '@sacre-coeur/data-access/services/classe/classe.service'
import type { ClassName, EleveDetails } from '@sacre-coeur/domain/types'
import { SupabaseErrorHandler } from '@sacre-coeur/school-features/feedback/supabase-error-handler'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface ClassInput { name: string; year: string }
interface ClassUpdate extends ClassInput { id: string }

export function useAdminClasses(selectedClassId: string, onClassSaved: () => void) {
  const queryClient = useQueryClient()
  const classesQuery = useFetchData<ClassName[]>(['classes'], () => classService.getAllClasses())
  const studentsQuery = useFetchData<EleveDetails[]>(
    ['studentClasses', selectedClassId],
    () => classService.getStudentsInClass(selectedClassId),
    { enabled: !!selectedClassId },
  )
  const createClass = useMutateData(({ name, year }: ClassInput) => classService.createClass(name, year), {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['classes'] })
      toast.success('Classe créée avec succès.')
      onClassSaved()
    },
    onError: error => SupabaseErrorHandler.handle(error),
  })
  const updateClass = useMutateData(({ id, name, year }: ClassUpdate) => classService.updateClass(id, {
    nom_classe: name, annee_scolaire: year,
  }), {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['classes'] })
      toast.success('Classe mise à jour avec succès.')
      onClassSaved()
    },
    onError: error => SupabaseErrorHandler.handle(error),
  })
  const deleteClass = useMutateData((id: string) => classService.deleteClass(id), {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['classes'] })
      toast.success('Classe supprimée avec succès.')
    },
    onError: error => SupabaseErrorHandler.handle(error),
  })

  return { classesQuery, studentsQuery, createClass, updateClass, deleteClass }
}
