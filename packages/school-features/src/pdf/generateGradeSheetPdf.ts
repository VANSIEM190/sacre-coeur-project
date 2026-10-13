import jsPDF from 'jspdf'

export interface GradeSheetExportData {
  className: string
  subject: string
  academicTerm: number
  schoolYear: string
  maxScore: number
  students: Array<{ name: string; score: number }>
}

export async function generateGradeSheetPdf(data: GradeSheetExportData): Promise<void> {
  const document = new jsPDF()
  const pageWidth = document.internal.pageSize.getWidth()
  const margin = 16
  let y = 20

  document.setFont('helvetica', 'bold')
  document.setFontSize(18)
  document.text('Fiche de cotation', margin, y)
  y += 12

  document.setFont('helvetica', 'normal')
  document.setFontSize(11)
  document.text(`Classe : ${data.className}`, margin, y)
  y += 7
  document.text(`Matière : ${data.subject}`, margin, y)
  y += 7
  document.text(`Période : ${data.academicTerm} · Année scolaire : ${data.schoolYear}`, margin, y)
  y += 7
  document.text(`Barème : ${data.maxScore} points`, margin, y)
  y += 10

  const scoreX = pageWidth - margin
  document.setFont('helvetica', 'bold')
  document.text('Élève', margin, y)
  document.text('Note', scoreX, y, { align: 'right' })
  y += 3
  document.setDrawColor(210, 210, 210)
  document.line(margin, y, scoreX, y)
  y += 7

  data.students.forEach((student, index) => {
    if (y > 275) {
      document.addPage()
      y = 20
    }
    document.setFont('helvetica', 'normal')
    document.text(`${index + 1}. ${student.name}`, margin, y, {
      maxWidth: pageWidth - margin * 2 - 30,
    })
    document.text(`${student.score} / ${data.maxScore}`, scoreX, y, { align: 'right' })
    y += 8
  })

  const safeName = `${data.className}-${data.subject}-periode-${data.academicTerm}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  document.save(`fiche-cotation-${safeName || 'classe'}.pdf`)
}
