import { useState } from "react";
import { toast } from "sonner";
import { useFetchData } from "@sacre-coeur/data-access/hooks/useQuery";
import { classService } from "@sacre-coeur/data-access/services/classe/classe.service";
import { horraireServices } from "@sacre-coeur/data-access/services/schedule/schedule.service";
import {
  gradeService,
  type GradeSheet,
} from "@sacre-coeur/data-access/services/grade/grade.service";
import { SupabaseErrorHandler } from "@sacre-coeur/school-features/feedback/supabase-error-handler";
import type { AcademicTerm } from "@sacre-coeur/domain/types";
import { useTeacherAssignments } from "../../classes/hooks/useTeacherAssignments";
import { buildGradeSheetInput } from "../utils/grade-sheet-form";
import { exportTeacherGradeSheet } from "../services/grade-sheet-export";
import { useTeacherGradeSheetMutations } from "./useTeacherGradeSheetMutations";
import { useTeacherGradeSheetDraft } from "./useTeacherGradeSheetDraft";

export interface TeacherGradeSheetSummary {
  id: string;
  classe_id: string;
  className: string;
  subject: string;
  academicTerm: AcademicTerm;
  maxScore: number;
  entriesCount: number;
  updatedAt: string;
  grades: GradeSheet["grades"];
}

export function useTeacherGradeSheet() {
  const assignments = useTeacherAssignments();
  const { currentUser, teacher, schoolYear, assignedClasses } = assignments;
  const [classId, setClassId] = useState("");

  const selectedClassId = classId || assignedClasses[0]?.id || "";
  const isAssigned = assignedClasses.some(
    (item) => item.id === selectedClassId,
  );
  const subjectsQuery = useFetchData(
    ["teacherCourses", teacher?.id, selectedClassId, schoolYear],
    () =>
      horraireServices.getTeacherCoursesInClass(teacher!.id, selectedClassId),
    { enabled: !!teacher?.id && isAssigned },
  );
  const subjects = (subjectsQuery.data ?? []).map((course) => course.subject);
  const draft = useTeacherGradeSheetDraft(subjects);
  const studentsQuery = useFetchData(
    ["students", "class", selectedClassId, currentUser?.id, schoolYear],
    () => classService.getTeacherStudentsInClass(selectedClassId, schoolYear),
    { enabled: isAssigned },
  );
  const sheetsQuery = useFetchData(
    ["gradeSheets", "teacher", currentUser?.id, schoolYear],
    () => gradeService.getTeacherGradeSheets(currentUser!.id, schoolYear),
    { enabled: !!currentUser?.id },
  );

  const students = studentsQuery.data ?? [];
  const sheets = sheetsQuery.data ?? [];
  const selectedSheet = sheets.find(
    (item) =>
      item.classe_id === selectedClassId &&
      item.subject === draft.selectedSubject &&
      item.academic_term === draft.academicTerm,
  );
  const maxScore = draft.maxScoreFor(selectedSheet);
  const scoreFor = (studentId: string) => draft.scoreFor(studentId, selectedSheet);
  const { saveMutation, deleteMutation } =
    useTeacherGradeSheetMutations(draft.clear);

  const summaries: TeacherGradeSheetSummary[] = sheets.map((sheet) => ({
    id: sheet.id,
    classe_id: sheet.classe_id,
    className:
      assignedClasses.find((item) => item.id === sheet.classe_id)?.nom_classe ??
      "Classe non disponible",
    subject: sheet.subject,
    academicTerm: sheet.academic_term,
    maxScore: sheet.max_score,
    entriesCount: sheet.grades.length,
    updatedAt: sheet.updated_at || sheet.created_at,
    grades: sheet.grades,
  }));

  const startEditing = (sheetId: string) => {
    const sheet = sheets.find((item) => item.id === sheetId);
    if (!sheet) return;
    setClassId(sheet.classe_id);
    draft.startEditing(sheet);
  };

  const save = () => {
    const result = buildGradeSheetInput({
      teacherId: currentUser?.id,
      isAssigned,
      subject: draft.selectedSubject,
      subjects,
      classId: selectedClassId,
      academicTerm: draft.academicTerm,
      maxScore,
      schoolYear,
      students,
      scoreFor,
    });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    saveMutation.mutate(result.input);
  };

  const deleteSheet = (sheetId: string) => {
    if (
      !window.confirm(
        "Supprimer cette fiche et toutes les notes qu'elle contient ? Cette action est définitive.",
      )
    )
      return;
    deleteMutation.mutate(sheetId);
  };

  const exportSheet = async (sheetId: string, format: "excel" | "pdf") => {
    const sheet = sheets.find((item) => item.id === sheetId);
    if (!sheet) return;
    try {
      await exportTeacherGradeSheet(sheet, assignedClasses, schoolYear, format);
    } catch (error) {
      SupabaseErrorHandler.handle(error);
    }
  };

  return {
    ...assignments,
    selectedClassId,
    selectedSubject: draft.selectedSubject,
    subjects,
    academicTerm: draft.academicTerm,
    maxScore,
    setMaxScoreInput: draft.setMaxScoreInput,
    students,
    scores: draft.scores,
    setScores: draft.setScores,
    scoreFor,
    sheets: summaries,
    mutation: saveMutation,
    deleteMutation,
    editingSheetId: draft.editingSheetId,
    save,
    startEditing,
    cancelEditing: draft.clear,
    deleteSheet,
    exportSheet,
    changeClass: (id: string) => {
      setClassId(id);
      draft.changeSubject("");
    },
    changeSubject: draft.changeSubject,
    changeAcademicTerm: draft.changeAcademicTerm,
    isLoading:
      assignments.isLoading ||
      studentsQuery.isLoading ||
      subjectsQuery.isLoading ||
      sheetsQuery.isLoading,
    error:
      assignments.error ??
      studentsQuery.error ??
      subjectsQuery.error ??
      sheetsQuery.error,
  };
}
