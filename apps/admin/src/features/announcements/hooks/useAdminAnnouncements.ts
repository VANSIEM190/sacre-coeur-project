import { useQueryClient } from '@tanstack/react-query'
import { useFetchData, useMutateData } from '@sacre-coeur/data-access/hooks/useQuery'
import { announcementService } from '@sacre-coeur/data-access/services/announcement/announcement.service'
import { classService } from '@sacre-coeur/data-access/services/classe/classe.service'
import type { Announcement, ClassName } from '@sacre-coeur/domain/types'

export function useAdminAnnouncements() {
  const queryClient = useQueryClient()
  const classesQuery = useFetchData<ClassName[]>(['classes'], () => classService.getAllClasses())
  const announcementsQuery = useFetchData<Announcement[]>(['announcements'], () => announcementService.getAnnouncement())
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['announcements'] })
  const createMutation = useMutateData(
    (input: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => announcementService.createAnnouncement(input),
    { onSuccess: refresh },
  )
  const updateMutation = useMutateData(
    ({ id, payload }: { id: string; payload: Partial<Announcement> }) => announcementService.updateAnnouncement(id, payload),
    { onSuccess: refresh },
  )
  const deleteMutation = useMutateData((id: string) => announcementService.deleteAnnouncement(id), { onSuccess: refresh })
  return { classesQuery, announcementsQuery, createMutation, updateMutation, deleteMutation }
}
