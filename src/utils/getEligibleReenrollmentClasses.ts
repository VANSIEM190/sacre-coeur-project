import type { ClassName } from '@/lib/types'

export function getEligibleReenrollmentClasses(
  currentClassName: string,
  allClasses: ClassName[]
): ClassName[] {
  if (
    !currentClassName ||
    !Array.isArray(allClasses) ||
    allClasses.length === 0
  ) {
    return []
  }

  // Helper 1: Nettoyage strict (minuscules, normalisation Unicode sans accents)
  const cleanString = (str: string): string =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, 'et') // Normalise '&' en 'et' pour éviter les incompatibilités
      .trim()

  // Helper 2: Extraire le premier chiffre
  const getLevelNumber = (str: string): number | null => {
    const cleaned = cleanString(str)
    const match = cleaned.match(/^(\d+)/)
    return match ? parseInt(match[1], 10) : null
  }

  // Helper 3: Extraire le nom propre de l'option en retirant le préfixe de niveau
  const getOptionName = (str: string): string => {
    const cleaned = cleanString(str)
    // Supprime le premier nombre et tous les suffixes/espaces adjacents (ex: "1ere ", "2eme ", "3e ")
    return cleaned.replace(/^\d+\s*(ere|ère|eme|ème|er|e)?\s*/i, '').trim()
  }

  const currentCleaned = cleanString(currentClassName)
  const currentLevel = getLevelNumber(currentClassName)

  if (currentLevel === null) return []

  const isPrimaire = currentCleaned.includes('primaire')

  // --- CAS 1 : PRIMAIRE ---
  if (isPrimaire) {
    if (currentLevel === 6) {
      // 6ème Primaire -> 7ème (EB / Cycle de base)
      return allClasses.filter(c => getLevelNumber(c.nom_classe) === 7)
    }
    if (currentLevel >= 1 && currentLevel < 6) {
      const nextLevel = currentLevel + 1
      return allClasses.filter(c => {
        const nameClean = cleanString(c.nom_classe)
        return (
          getLevelNumber(c.nom_classe) === nextLevel &&
          nameClean.includes('primaire')
        )
      })
    }
    return []
  }

  // --- CAS 2 : CYCLE DE BASE (7ème et 8ème) ---
  if (currentLevel === 7) {
    // 7ème -> 8ème
    return allClasses.filter(c => getLevelNumber(c.nom_classe) === 8)
  }

  if (currentLevel === 8) {
    // 8ème -> Toutes les 1ères des Humanités (Exclut la 1ère Primaire)
    return allClasses.filter(c => {
      const level = getLevelNumber(c.nom_classe)
      const nameClean = cleanString(c.nom_classe)
      return level === 1 && !nameClean.includes('primaire')
    })
  }

  // --- CAS 3 : HUMANITÉS / SECONDAIRE (1ère, 2ème, 3ème) ---
  if (currentLevel >= 1 && currentLevel <= 3) {
    const nextLevel = currentLevel + 1
    const currentOption = getOptionName(currentClassName)

    return allClasses.filter(c => {
      const level = getLevelNumber(c.nom_classe)
      const nameClean = cleanString(c.nom_classe)

      // Le niveau doit être le niveau suivant et hors primaire
      if (level !== nextLevel || nameClean.includes('primaire')) {
        return false
      }

      const targetOption = getOptionName(c.nom_classe)

      if (!currentOption || !targetOption) return false

      return (
        targetOption.includes(currentOption) ||
        currentOption.includes(targetOption)
      )
    })
  }

  // 4ème Humanités -> Diplômé
  return []
}
