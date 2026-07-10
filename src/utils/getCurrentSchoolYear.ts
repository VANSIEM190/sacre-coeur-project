/**
 * Calcule l'année scolaire selon le calendrier de Kinshasa
 * Bascule automatique dès le 1er Juillet (après les proclamations du 3ème trimestre)
 */
export function getCurrentSchoolYear(): string {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() // 0 = Janvier, 5 = Juin, 6 = Juillet, 11 = Décembre

  let startYear: number
  let endYear: number

  // 6 correspond au mois de Juillet en JavaScript
  if (currentMonth >= 6) {
    // Du 1er juillet au 31 décembre : on prépare ou on commence la nouvelle année
    startYear = currentYear
    endYear = currentYear + 1
  } else {
    // Du 1er janvier au 30 juin : on termine l'année commencée l'an passé
    startYear = currentYear - 1
    endYear = currentYear
  }

  return `${startYear}-${endYear}`
}
