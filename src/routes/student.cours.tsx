import { PageHeader } from '@/components/dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import { useSchoolStore } from '@/stores/school-store'
import { Download } from 'lucide-react'
import type { StudentUser } from '@/lib/types'

const fakeDownload = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function StudentCours() {
  const student = useAuthStore(s => s.currentUser) as StudentUser
  const courses = useSchoolStore(s => s.courses).filter(
    c => c.className === student?.currentClassName
  )
  return (
    <div>
      <PageHeader title="Mes cours" subtitle={student?.currentClassName} />
      <div className="space-y-3">
        {courses.map(c => (
          <div
            key={c.id}
            className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between gap-4"
          >
            <div>
              <p className="font-semibold">{c.title}</p>
              <p className="text-sm opacity-70">{c.description}</p>
            </div>
            <button
              onClick={() => fakeDownload(`${c.title}.pdf`, c.description)}
              className="px-4 py-2 rounded-full border border-border text-sm font-semibold flex items-center gap-1.5 hover:bg-sacred-red hover:text-white hover:border-sacred-red"
            >
              <Download className="size-4" /> PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StudentCours
