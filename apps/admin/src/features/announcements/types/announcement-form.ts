import type { SchoolClassName } from '@sacre-coeur/domain/types'

export type AnnouncementTarget = 'all' | SchoolClassName

export interface AnnouncementFormState {
  title: string
  body: string
  target: AnnouncementTarget
}
