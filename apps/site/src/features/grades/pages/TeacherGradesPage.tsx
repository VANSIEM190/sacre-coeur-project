import { PageHeader } from '@sacre-coeur/ui/layouts/dashboard-shell'
import type { PaymentTranche } from '@sacre-coeur/domain/types'
import { Send, Loader2 } from 'lucide-react'
import { useTeacherGradeSheet } from '../hooks/useTeacherGradeSheet'

export default function TeacherGradesPage() {
  const sheet = useTeacherGradeSheet()
  return (
    <div>
      <PageHeader title="Fiches de cotation" subtitle="Saisissez et enregistrez les points de vos élèves." />
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4 mb-8">
        <div className="grid sm:grid-cols-3 gap-3">
          <select value={sheet.selectedClassId} onChange={event => sheet.changeClass(event.target.value)} className="px-4 py-3 rounded-xl border border-border bg-background" aria-label="Classe">
            {sheet.assignedClasses.length === 0 && <option value="">Aucune classe attribuée</option>}
            {sheet.assignedClasses.map(schoolClass => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.nom_classe}</option>)}
          </select>
          <select value={sheet.selectedSubject} onChange={event => sheet.changeSubject(event.target.value)} className="px-4 py-3 rounded-xl border border-border bg-background" aria-label="Matière">
            {sheet.subjects.length === 0 && <option value="">Aucune matière attribuée</option>}
            {sheet.subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
          </select>
          <select value={sheet.tranche} onChange={event => sheet.changeTranche(Number(event.target.value) as PaymentTranche)} className="px-4 py-3 rounded-xl border border-border bg-background" aria-label="Tranche">
            <option value={1}>Tranche 1</option><option value={2}>Tranche 2</option><option value={3}>Tranche 3</option>
          </select>
        </div>
        <div className="space-y-2">
          {sheet.isLoading ? <div className="flex justify-center py-6"><Loader2 className="size-6 animate-spin" /></div> : sheet.error ? (
            <p className="text-sm text-destructive py-6">Impossible de charger les données de cotation.</p>
          ) : sheet.students.map(student => {
            const score = sheet.scoreFor(student.id)
            const maxScore = sheet.maxScoreFor(student.id)
            return (
              <div key={student.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background border border-border">
                <span className="font-medium text-sm">{[student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ')}</span>
                <div className="flex items-center gap-3">
                  <input type="number" min={0} max={maxScore} step="0.5" value={score} onChange={event => sheet.setScores({ ...sheet.scores, [student.id]: event.target.value })} className="w-20 px-3 py-2 rounded-lg border border-border bg-card text-sm" aria-label={`Note de ${student.firstName} ${student.lastName}`} />
                  <span className="text-xs opacity-60 w-16 text-right">{score === '' ? '—' : `${((Number(score) / maxScore) * 100).toFixed(1)}%`}</span>
                </div>
              </div>
            )
          })}
          {!sheet.isLoading && !sheet.error && sheet.students.length === 0 && <p className="text-sm opacity-60 text-center py-6">Aucun élève dans cette classe.</p>}
        </div>
        <button onClick={sheet.save} disabled={sheet.isLoading || !!sheet.error || sheet.mutation.isPending || sheet.students.length === 0 || !sheet.selectedSubject} className="px-5 py-2.5 rounded-full bg-sacred-red text-white font-semibold flex items-center gap-2 disabled:opacity-50">
          {sheet.mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Enregistrer la fiche
        </button>
      </div>
      <h2 className="font-display text-2xl mb-4">Fiches enregistrées</h2>
      <div className="space-y-2">
        {sheet.sheets.map(item => (
          <div key={item.id} className="p-4 rounded-2xl bg-card border border-border">
            <p className="font-semibold">{item.subject} — {item.className} · Tranche {item.tranche}</p>
            <p className="text-xs opacity-60">{item.entriesCount} élèves · mise à jour le {new Date(item.updatedAt).toLocaleDateString('fr-FR')}</p>
          </div>
        ))}
        {!sheet.isLoading && !sheet.error && sheet.sheets.length === 0 && <p className="text-sm opacity-60">Aucune fiche enregistrée pour cette année scolaire.</p>}
      </div>
    </div>
  )
}
