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

export const filterByDate = <T>(data: T[], dateKey: keyof T): T[] => {
  const threeWeeksAgo = new Date()
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21)

  // On retourne directement le tableau filtré
  return data.filter(item => {
    // Sécurité : Récupération dynamique et conversion de la date de l'élément courant
    const rawDate = item[dateKey]
    if (!rawDate) return false

    const createdDate = new Date(rawDate as unknown as string | number | Date)

    // Validation : Éliminer si la date est invalide ou plus vieille que 3 semaines
    if (isNaN(createdDate.getTime()) || createdDate < threeWeeksAgo) {
      return false
    }

    return true
  })
}
