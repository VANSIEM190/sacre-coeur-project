import type { TeacherRosterStudent, AcademicTerm } from "@sacre-coeur/domain/types";
import type { GradeSheetInput } from "@sacre-coeur/data-access/services/grade/grade.service";

interface GradeSheetDraft {
  teacherId?: string;
  isAssigned: boolean;
  subject: string;
  subjects: string[];
  classId: string;
  academicTerm: AcademicTerm;
  maxScore: string;
  schoolYear: string;
  students: TeacherRosterStudent[];
  scoreFor: (studentId: string) => string;
}

export function buildGradeSheetInput(draft: GradeSheetDraft):
  | { input: GradeSheetInput }
  | { error: string } {
  if (!draft.teacherId || !draft.isAssigned || !draft.subjects.includes(draft.subject)) {
    return { error: "Sélectionnez une classe et une matière qui vous sont attribuées." };
  }
  if (draft.students.length === 0) {
    return { error: "Cette classe ne contient aucun élève à noter." };
  }

  const maxScore = Number(draft.maxScore);
  if (!Number.isFinite(maxScore) || maxScore <= 0) {
    return { error: "Saisissez un point maximum supérieur à zéro." };
  }
  if (draft.students.some((student) => draft.scoreFor(student.id).trim() === "")) {
    return { error: "Saisissez une note pour chaque élève avant de valider la fiche." };
  }
  if (draft.students.some((student) => {
    const score = Number(draft.scoreFor(student.id));
    return !Number.isFinite(score) || score < 0 || score > maxScore;
  })) {
    return { error: "Chaque note doit être comprise entre zéro et le point maximum." };
  }

  return {
    input: {
      classe_id: draft.classId,
      teacher_id: draft.teacherId,
      subject: draft.subject,
      academic_term: draft.academicTerm,
      max_score: maxScore,
      school_year: draft.schoolYear,
      grades: draft.students.map((student) => ({
        eleve_id: student.id,
        score: Number(draft.scoreFor(student.id)),
      })),
    },
  };
}
