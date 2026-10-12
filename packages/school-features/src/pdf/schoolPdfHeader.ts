import type jsPDF from 'jspdf'

// --- INFOS DE L'ÉCOLE ---
// ⚠️ À adapter avec les vraies coordonnées de l'établissement.
export const SCHOOL_NAME = 'CS Sacré Cœur De Jésus'
export const SCHOOL_PHONE = '+243 810 860 751'
export const SCHOOL_EMAIL = 'contact@sacrecoeur.edu'
export const SCHOOL_ADDRESS =
  "Av. INDONDO/KIKWIT N°36/40 Q/ MPASSA2 C/ N'SELE KINSHASA , RDC"

// Chemin du logo (fichier placé dans le dossier `public/` du projet,
// donc accessible directement via une URL relative comme '/imgAcc.jpg').
// Laisser vide ('') si aucun logo n'est disponible : l'en-tête sera généré sans image.
export const SCHOOL_LOGO_PATH = '/imgAcc.jpg'

type LogoData = { dataUrl: string; format: 'PNG' | 'JPEG' }

// Cache mémoire pour éviter de recharger/reconvertir le logo à chaque téléchargement
let cachedLogo: LogoData | null | undefined

/**
 * Charge une image depuis une URL (ex: dossier public/) et la convertit
 * en data URI base64 exploitable par jsPDF (`doc.addImage`).
 * Retourne `null` si le fichier est introuvable ou illisible.
 */
export async function loadLogoAsBase64(): Promise<LogoData | null> {
  if (cachedLogo !== undefined) return cachedLogo
  if (!SCHOOL_LOGO_PATH) {
    cachedLogo = null
    return null
  }

  try {
    const response = await fetch(SCHOOL_LOGO_PATH)
    if (!response.ok) throw new Error('Logo introuvable')
    const blob = await response.blob()

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Lecture du logo échouée'))
      reader.readAsDataURL(blob)
    })

    const format: 'PNG' | 'JPEG' = blob.type.includes('png') ? 'PNG' : 'JPEG'

    cachedLogo = { dataUrl, format }
    return cachedLogo
  } catch (error) {
    console.error('[schoolPdfHeader] Logo non chargé :', error)
    cachedLogo = null
    return null
  }
}

/**
 * Dessine l'en-tête institutionnel (logo, nom de l'école, coordonnées)
 * en haut de la page courante d'un document jsPDF, et renvoie la
 * position Y à partir de laquelle le contenu peut commencer.
 */
export function drawSchoolHeader(
  doc: jsPDF,
  marginX: number,
  logo: LogoData | null
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const y = 15
  const logoSize = 20
  const hasLogo = !!logo

  if (logo) {
    try {
      doc.addImage(logo.dataUrl, logo.format, marginX, y, logoSize, logoSize)
    } catch (error) {
      console.error('[schoolPdfHeader] addImage a échoué :', error)
    }
  }

  const textX = hasLogo ? marginX + logoSize + 5 : marginX

  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(SCHOOL_NAME, textX, y + 6)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Tél : ${SCHOOL_PHONE}  •  Email : ${SCHOOL_EMAIL}`, textX, y + 12)
  doc.text(`Adresse : ${SCHOOL_ADDRESS}`, textX, y + 17)

  const headerBottom = y + Math.max(logoSize, 20) + 4

  doc.setDrawColor(200, 200, 200)
  doc.line(marginX, headerBottom, pageWidth - marginX, headerBottom)

  return headerBottom + 8
}
