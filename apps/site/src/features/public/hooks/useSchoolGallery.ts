import { useEffect, useMemo, useState } from 'react'
import type { Category, GalleryItem } from '../types/gallery'

const ITEMS_PER_PAGE = 12

export function useSchoolGallery(galleryItems: GalleryItem[]) {
  const [activeFilter, setActiveFilter] = useState<Category>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [isBuildingFullscreen, setIsBuildingFullscreen] = useState(false)

  useEffect(() => {
    document.title = 'Sacré Cœur de Jésus - Notre École'
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsBuildingFullscreen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filteredItems = useMemo(
    () => galleryItems.filter(item => activeFilter === 'all' || item.category === activeFilter),
    [galleryItems, activeFilter],
  )
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredItems.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredItems, currentPage])
  const changeFilter = (category: Category) => {
    setActiveFilter(category)
    setCurrentPage(1)
  }

  return {
    activeFilter,
    currentPage,
    totalPages,
    paginatedItems,
    selectedItem,
    isBuildingFullscreen,
    setCurrentPage,
    setSelectedItem,
    setIsBuildingFullscreen,
    changeFilter,
  }
}
