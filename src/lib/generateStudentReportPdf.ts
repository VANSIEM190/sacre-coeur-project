import jsPDF from 'jspdf'
import type { EleveDetails, PaymentReceipt } from '@/lib/types'
import { drawSchoolHeader, loadLogoAsBase64 } from '@/lib/schoolPdfHeader'

type TrancheKey = 1 | 2 | 3
type TrancheStatus = 'Non entamée' | 'Réglée' | 'Incomplète'

interface TrancheData {
  paidUSD: number
  paidFC: number
  requiredUSD: number
  requiredFC: number
  status: TrancheStatus
}

interface StudentReportData {
  student: EleveDetails
  schoolYear: string
  totals: { USD: number; FC: number }
  tranches: Record<TrancheKey, TrancheData>
  receipts: PaymentReceipt[]
}

const getStudentFullName = (s: Partial<EleveDetails>): string => {
  return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ')
}

/**
 * Génère un rapport PDF du profil financier/scolaire d'un élève et
 * déclenche son téléchargement dans le navigateur.
 * Génération 100% côté client — aucune donnée n'est envoyée à un serveur
 * tiers pour la création du PDF.
 */
export async function generateStudentReportPdf(
  data: StudentReportData
): Promise<void> {
  const { student, schoolYear, totals, tranches, receipts } = data
  const doc = new jsPDF()
  const marginX = 15
  const pageHeight = doc.internal.pageSize.getHeight()

  const logo = await loadLogoAsBase64()
  let y = drawSchoolHeader(doc, marginX, logo)

  // --- Titre du rapport ---
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Rapport de scolarité', marginX, y)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Généré le ${new Date().toLocaleDateString()}`,
    doc.internal.pageSize.getWidth() - marginX,
    y,
    { align: 'right' }
  )
  y += 12

  // --- Infos élève ---
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(getStudentFullName(student), marginX, y)
  y += 7

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Classe : ${student.currentClassName || 'Non assignée'}`, marginX, y)
  y += 6
  doc.text(`Année scolaire : ${schoolYear}`, marginX, y)
  y += 12

  // --- Totaux payés ---
  doc.setFont('helvetica', 'bold')
  doc.text('Totaux payés', marginX, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.text(`USD : ${totals.USD} USD`, marginX, y)
  y += 6
  doc.text(`FC : ${totals.FC} FC`, marginX, y)
  y += 12

  // --- État des tranches ---
  doc.setFont('helvetica', 'bold')
  doc.text('État des tranches (Minerval)', marginX, y)
  y += 8

  doc.setFontSize(9)
  ;([1, 2, 3] as const).forEach(t => {
    const info = tranches[t]
    doc.setFont('helvetica', 'bold')
    doc.text(`Tranche ${t} — ${info.status}`, marginX, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.text(
      `  Payé USD : ${info.paidUSD} / ${info.requiredUSD} USD`,
      marginX,
      y
    )
    y += 5
    doc.text(`  Payé FC : ${info.paidFC} / ${info.requiredFC} FC`, marginX, y)
    y += 8
  })

  y += 4

  // --- Historique des reçus ---
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Historique des reçus', marginX, y)
  y += 8

  doc.setFontSize(9)
  if (receipts.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.text('Aucun reçu pour cette année scolaire.', marginX, y)
    y += 6
  } else {
    receipts.forEach(r => {
      // Nouvelle page si on approche du bas (avec en-tête répété)
      if (y > pageHeight - 20) {
        doc.addPage()
        y = drawSchoolHeader(doc, marginX, logo)
      }
      doc.setFont('helvetica', 'normal')
      const date = new Date(r.paidAt).toLocaleDateString()
      doc.text(
        `Reçu #${r.id.slice(0, 8)} — Tranche ${r.tranche} — ${date} — ${r.amount} ${r.currency}`,
        marginX,
        y
      )
      y += 6
    })
  }

  // --- Nom de fichier sûr (retire les caractères spéciaux) ---
  const safeName = getStudentFullName(student)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  doc.save(`rapport-${safeName || 'eleve'}-${schoolYear}.pdf`)
}
