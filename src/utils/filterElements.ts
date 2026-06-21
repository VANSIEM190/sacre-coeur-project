import type { filterElementType } from '@/lib/types'

export const filterElement = <T>({
  items,
  keys,
  searchQuery,
  selectKey,
  selectedValue = 'Tous',
}: filterElementType<T>): T[] => {
  if (!items) return []

  return items.filter(item => {
    const matchesSearch =
      searchQuery === '' ||
      keys.some(key => {
        const value = item[key]
        if (value === null || value === undefined) return false
        return value
          .toString()
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      })

    const matchesSelect =
      selectedValue === 'Tous' ||
      !selectKey ||
      String(item[selectKey]) === selectedValue

    return matchesSearch && matchesSelect
  })
}
