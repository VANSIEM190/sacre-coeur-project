import type { ArchiveDocument, ArchiveDocumentUpdateInput } from '@sacre-coeur/domain/types'

export type ArchiveCategory = ArchiveDocument['category']

export interface ArchiveCreateForm {
  title: string
  year: number
  category: ArchiveCategory
  description: string
}

export type ArchiveEditForm = ArchiveDocumentUpdateInput
