import { PageHeader } from '@/components/dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import { useSchoolStore } from '@/stores/school-store'
import type { StudentUser } from '@/lib/types'
import { Download } from 'lucide-react'

function StudentHoraires() {
  const student = useAuthStore(s => s.currentUser) as StudentUser
  const schedule = useSchoolStore(s => s.schedule).filter(
    s => s.className === student?.currentClassName
  )

  const downloadPdf = () => {
    const content = schedule
      .map(
        s =>
          `${s.dayOfWeek} ${s.startTime}-${s.endTime} ${s.subject} (${s.room})`
      )
      .join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `horaires_${student?.currentClassName}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title="Horaires de ma classe"
        subtitle={student?.currentClassName}
        action={
          <button
            onClick={downloadPdf}
            className="px-4 py-2 rounded-full bg-sacred-red text-white text-sm font-semibold flex items-center gap-2"
          >
            <Download className="size-4" /> Télécharger PDF
          </button>
        }
      />
      <div className="space-y-2">
        {schedule.map(s => (
          <div
            key={s.id}
            className="p-4 rounded-2xl bg-card border border-border flex items-center gap-4"
          >
            <div className="text-center w-24">
              <p className="font-display text-sm">{s.dayOfWeek}</p>
              <p className="text-xs opacity-60">
                {s.startTime}-{s.endTime}
              </p>
            </div>
            <div>
              <p className="font-semibold">{s.subject}</p>
              <p className="text-xs opacity-60">{s.room}</p>
            </div>
          </div>
        ))}
        {schedule.length === 0 && (
          <p className="text-sm opacity-60 text-center py-12">
            Aucun horaire défini pour votre classe.
          </p>
        )}
      </div>
    </div>
  )
}

export default StudentHoraires
