import { PageHeader } from "@sacre-coeur/ui/layouts/dashboard-shell";
import { useTeacherGradeSheet } from "../hooks/useTeacherGradeSheet";
import { GradeSheetForm } from "../components/GradeSheetForm";
import { GradeSheetList } from "../components/GradeSheetList";

export default function TeacherGradesPage() {
  const sheet = useTeacherGradeSheet();

  return (
    <div>
      <PageHeader title="Fiches de cotation" subtitle="Saisissez et enregistrez les points de vos élèves." />
      <GradeSheetForm
        classes={sheet.assignedClasses}
        subjects={sheet.subjects}
        selectedClassId={sheet.selectedClassId}
        selectedSubject={sheet.selectedSubject}
        academicTerm={sheet.academicTerm}
        maxScore={sheet.maxScore}
        students={sheet.students}
        scores={sheet.scores}
        scoreFor={sheet.scoreFor}
        setScores={sheet.setScores}
        setMaxScore={sheet.setMaxScoreInput}
        isLoading={sheet.isLoading}
        hasError={!!sheet.error}
        isSaving={sheet.mutation.isPending || sheet.deleteMutation.isPending}
        isEditing={!!sheet.editingSheetId}
        onClassChange={sheet.changeClass}
        onSubjectChange={sheet.changeSubject}
        onTermChange={sheet.changeAcademicTerm}
        onSubmit={sheet.save}
        onCancel={sheet.cancelEditing}
      />
      <h2 className="mb-4 font-display text-2xl">Fiches enregistrées</h2>
      <GradeSheetList
        sheets={sheet.sheets}
        isDeleting={sheet.deleteMutation.isPending}
        onEdit={sheet.startEditing}
        onDelete={sheet.deleteSheet}
        onExport={sheet.exportSheet}
      />
      {!sheet.isLoading && !sheet.error && sheet.sheets.length === 0 && (
        <p className="text-sm opacity-60">Aucune fiche enregistrée pour cette année scolaire.</p>
      )}
    </div>
  );
}
