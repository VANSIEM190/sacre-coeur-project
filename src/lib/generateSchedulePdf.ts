import jsPDF from 'jspdf'
import type { ScheduleEntry, ClassName } from '@/lib/types'
import { drawSchoolHeader, loadLogoAsBase64 } from '@/lib/schoolPdfHeader'

const DAYS: ScheduleEntry['dayOfWeek'][] = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
]

interface ScheduleReportData {
  targetClass: ClassName
  schoolYear: string
  schedule: ScheduleEntry[]
}

/**
 * Génère un PDF de l'emploi du temps d'une classe (regroupé par jour)
 * et déclenche son téléchargement dans le navigateur.
 * Génération 100% côté client — aucune donnée n'est envoyée à un serveur
 * tiers pour la création du PDF.
 */
export async function generateSchedulePdf(
  data: ScheduleReportData
): Promise<void> {
  const { targetClass, schoolYear, schedule } = data
  const doc = new jsPDF()
  const marginX = 15
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const logo = await loadLogoAsBase64()
  let y = drawSchoolHeader(doc, marginX, logo)

  // --- Titre du rapport ---
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`Emploi du temps — ${targetClass.nom_classe}`, marginX, y)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Généré le ${new Date().toLocaleDateString()}`,
    pageWidth - marginX,
    y,
    { align: 'right' }
  )
  y += 8

  doc.setFontSize(10)
  doc.text(`Année scolaire : ${schoolYear}`, marginX, y)
  y += 12

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 15) {
      doc.addPage()
      y = drawSchoolHeader(doc, marginX, logo)
    }
  }

  DAYS.forEach(day => {
    const dayEntries = schedule
      .filter(e => e.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

    ensureSpace(14)

    // --- Titre du jour ---
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(day, marginX, y)
    y += 2
    doc.setDrawColor(220, 220, 220)
    doc.line(marginX, y, pageWidth - marginX, y)
    y += 6

    if (dayEntries.length === 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(140, 140, 140)
      doc.text('Aucun cours programmé', marginX + 2, y)
      doc.setTextColor(0, 0, 0)
      y += 8
    } else {
      dayEntries.forEach(e => {
        ensureSpace(9)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(`${e.startTime} - ${e.endTime}`, marginX + 2, y)
        doc.setFont('helvetica', 'normal')
        const details = `${e.subject} — Local : ${e.room}${
          e.teacherName ? ` · Prof : ${e.teacherName}` : ''
        }`
        doc.text(details, marginX + 32, y)
        y += 6
      })
      y += 3
    }
  })

  // --- Nom de fichier sûr (retire les caractères spéciaux) ---
  const safeClassName = targetClass.nom_classe
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  doc.save(`horaire-${safeClassName || 'classe'}-${schoolYear}.pdf`)
}
