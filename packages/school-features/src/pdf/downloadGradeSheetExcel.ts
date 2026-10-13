import type { GradeSheetExportData } from './generateGradeSheetPdf'

function escapeCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`
}

export function downloadGradeSheetExcel(data: GradeSheetExportData): void {
  const rows = [
    ['Classe', data.className],
    ['Matière', data.subject],
    ['Période', data.academicTerm],
    ['Année scolaire', data.schoolYear],
    ['Barème', data.maxScore],
    [],
    ['Élève', 'Note', 'Pourcentage'],
    ...data.students.map((student) => [
      student.name,
      `${student.score} / ${data.maxScore}`,
      `${((student.score / data.maxScore) * 100).toFixed(1)}%`,
    ]),
  ]
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCell).join(';')).join('\r\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const safeName = `${data.className}-${data.subject}-periode-${data.academicTerm}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  link.href = url
  link.download = `fiche-cotation-${safeName || 'classe'}.csv`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
