export type Category = 'all' | 'classe' | 'eleves' | 'administration' | 'sortie' | 'stage' | 'deliberation' | 'culture'
export interface GalleryItem { id: string | number; src: string; videoSrc?: string; title: string; text?: string; category: Category }
export const FILTER_BUTTONS: { label: string; value: Category }[] = [
  { label: 'Tout voir', value: 'all' }, { label: 'Enseignement', value: 'classe' },
  { label: 'Vie Élève', value: 'eleves' }, { label: 'Administration', value: 'administration' },
  { label: 'Sorties & Visites', value: 'sortie' }, { label: 'Stages', value: 'stage' },
  { label: 'Délibérations', value: 'deliberation' }, { label: 'Journée Culturelle', value: 'culture' },
]
