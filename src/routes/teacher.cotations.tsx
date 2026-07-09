import { PageHeader } from '@/components/dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import { useSchoolStore } from '@/stores/school-store'
import { useState } from 'react'
import type {
  TeacherUser,
  StudentUser,
  SchoolClassName,
  PaymentTranche,
} from '@/lib/types'
import { Send } from 'lucide-react'

function TeacherCotations() {
  const teacher = useAuthStore(s => s.currentUser) as TeacherUser
  const users = useAuthStore(s => s.registeredUsers)
  const submit = useSchoolStore(s => s.submitGradingSheet)
  const sheets = useSchoolStore(s => s.gradingSheets)
  // const [cls, setCls] = useState<SchoolClassName>(
  //   teacher?.assignedclasses[0] ?? '4ème Secondaire'
  // )
  const [subject, setSubject] = useState('')
  const [tranche, setTranche] = useState<PaymentTranche>(1)
  const [scores, setScores] = useState<Record<string, number>>({})

  // const students = users.filter(
  //   (u): u is StudentUser =>
  //     u.role === 'student' && u.currentClassName === cls && u.isValidatedByAdmin
  // )

  // const send = () => {
  //   if (!teacher || !subject) return
  //   submit({
  //     teacherId: teacher.id,
  //     className: cls,
  //     subject,
  //     tranche,
  //     entries: students.map(s => ({
  //       studentId: s.id,
  //       score: scores[s.id] ?? 0,
  //       maxScore: 20,
  //     })),
  //   })
  //   setSubject('')
  //   setScores({})
  // }

  return (
    <div>
      <PageHeader
        title="Fiches de cotation"
        subtitle="Saisissez et envoyez les points à l'administration."
      />
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4 mb-8">
        <div className="grid sm:grid-cols-3 gap-3">
          {/* <select
            value={cls}
            onChange={e => setCls(e.target.value as SchoolClassName)}
            className="px-4 py-3 rounded-xl border border-border bg-background"
          >
            {teacher?.assignedclasses.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select> */}
          <input
            placeholder="Matière"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="px-4 py-3 rounded-xl border border-border bg-background"
          />
          <select
            value={tranche}
            onChange={e => setTranche(Number(e.target.value) as PaymentTranche)}
            className="px-4 py-3 rounded-xl border border-border bg-background"
          >
            <option value={1}>Tranche 1</option>
            <option value={2}>Tranche 2</option>
            <option value={3}>Tranche 3</option>
          </select>
        </div>
        <div className="space-y-2">
          {/* {students.map(s => {
            const score = scores[s.id] ?? 0
            const percent = ((score / 20) * 100).toFixed(1)
            return (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background border border-border"
              >
                <span className="font-medium text-sm">{s.fullName}</span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={score}
                    onChange={e =>
                      setScores({ ...scores, [s.id]: Number(e.target.value) })
                    }
                    className="w-20 px-3 py-2 rounded-lg border border-border bg-card text-sm"
                  />
                  <span className="text-xs opacity-60 w-16 text-right">
                    {percent}%
                  </span>
                </div>
              </div>
            )
          })}
          {students.length === 0 && (
            <p className="text-sm opacity-60 text-center py-6">
              Aucun élève dans cette classe.
            </p>
          )} */}
        </div>
        <button
          // onClick={send}
          className="px-5 py-2.5 rounded-full bg-sacred-red text-white font-semibold flex items-center gap-2"
        >
          <Send className="size-4" /> Envoyer à l'admin
        </button>
      </div>

      <h2 className="font-display text-2xl mb-4">Fiches envoyées</h2>
      <div className="space-y-2">
        {sheets
          .filter(s => s.teacherId === teacher?.id)
          .map(s => (
            <div
              key={s.id}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <p className="font-semibold">
                {s.subject} — {s.className} · Tranche {s.tranche}
              </p>
              <p className="text-xs opacity-60">
                {s.entries.length} élèves · envoyée le{' '}
                {new Date(s.submittedAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          ))}
      </div>
    </div>
  )
}

export default TeacherCotations
