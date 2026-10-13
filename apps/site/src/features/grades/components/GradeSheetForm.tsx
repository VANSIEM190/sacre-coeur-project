import type { Dispatch, SetStateAction } from "react";
import type { AcademicTerm, ClassName, TeacherRosterStudent } from "@sacre-coeur/domain/types";
import { Loader2, Send } from "lucide-react";

interface GradeSheetFormProps {
  classes: ClassName[];
  subjects: string[];
  selectedClassId: string;
  selectedSubject: string;
  academicTerm: AcademicTerm;
  maxScore: string;
  students: TeacherRosterStudent[];
  scores: Record<string, string>;
  scoreFor: (studentId: string) => string;
  setScores: Dispatch<SetStateAction<Record<string, string>>>;
  setMaxScore: (value: string) => void;
  isLoading: boolean;
  hasError: boolean;
  isSaving: boolean;
  isEditing: boolean;
  onClassChange: (id: string) => void;
  onSubjectChange: (subject: string) => void;
  onTermChange: (term: AcademicTerm) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function GradeSheetForm({
  classes,
  subjects,
  selectedClassId,
  selectedSubject,
  academicTerm,
  maxScore,
  students,
  scores,
  scoreFor,
  setScores,
  setMaxScore,
  isLoading,
  hasError,
  isSaving,
  isEditing,
  onClassChange,
  onSubjectChange,
  onTermChange,
  onSubmit,
  onCancel,
}: GradeSheetFormProps) {
  return (
    <section className="mb-8 space-y-4 rounded-3xl border border-border bg-card p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <select value={selectedClassId} onChange={(event) => onClassChange(event.target.value)} className="rounded-xl border border-border bg-background px-4 py-3" aria-label="Classe">
          {classes.length === 0 && <option value="">Aucune classe attribuée</option>}
          {classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.nom_classe}</option>)}
        </select>
        <select value={selectedSubject} onChange={(event) => onSubjectChange(event.target.value)} className="rounded-xl border border-border bg-background px-4 py-3" aria-label="Matière">
          {subjects.length === 0 && <option value="">Aucune matière attribuée</option>}
          {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
        </select>
        <select value={academicTerm} onChange={(event) => onTermChange(Number(event.target.value) as AcademicTerm)} className="rounded-xl border border-border bg-background px-4 py-3" aria-label="Période scolaire">
          <option value={1}>Période 1</option><option value={2}>Période 2</option><option value={3}>Période 3</option>
        </select>
      </div>

      <label className="grid max-w-xs gap-1 text-sm font-medium">
        Point maximum pour toute la fiche
        <input type="number" min={0.01} step="0.5" value={maxScore} onChange={(event) => setMaxScore(event.target.value)} className="rounded-xl border border-border bg-background px-4 py-3" aria-label="Point maximum commun à tous les élèves" />
      </label>

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="size-6 animate-spin" /></div>
        ) : hasError ? (
          <p role="alert" className="py-6 text-sm text-destructive">Impossible de charger les données. Vérifiez que la migration de cotation est appliquée et que votre classe et votre matière sont attribuées.</p>
        ) : students.map((student) => {
          const score = scoreFor(student.id);
          const max = Number(maxScore);
          return (
            <div key={student.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
              <span className="text-sm font-medium">{[student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ")}</span>
              <div className="flex items-center gap-3">
                <input type="number" min={0} max={max} step="0.5" value={score} onChange={(event) => setScores({ ...scores, [student.id]: event.target.value })} className="w-20 rounded-lg border border-border bg-card px-3 py-2 text-sm" aria-label={`Note de ${student.firstName} ${student.lastName}`} />
                <span className="w-16 text-right text-xs opacity-60">{score === "" ? "—" : `${((Number(score) / max) * 100).toFixed(1)}%`}</span>
              </div>
            </div>
          );
        })}
        {!isLoading && !hasError && students.length === 0 && <p className="py-6 text-center text-sm opacity-60">Aucun élève dans cette classe.</p>}
      </div>

      <div>
        <button type="button" onClick={onSubmit} disabled={isLoading || hasError || isSaving || students.length === 0 || !selectedSubject} className="inline-flex items-center gap-2 rounded-full bg-sacred-red px-5 py-2.5 font-semibold text-white disabled:opacity-50">
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {isEditing ? "Enregistrer les modifications" : "Enregistrer la fiche"}
        </button>
        {isEditing && <button type="button" onClick={onCancel} className="ml-2 rounded-full border border-border px-5 py-2.5 font-semibold">Annuler la modification</button>}
      </div>
    </section>
  );
}
