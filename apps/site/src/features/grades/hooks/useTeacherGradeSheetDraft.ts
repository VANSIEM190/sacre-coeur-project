import { useState } from "react";
import type { AcademicTerm } from "@sacre-coeur/domain/types";
import type { GradeSheet } from "@sacre-coeur/data-access/services/grade/grade.service";

export function useTeacherGradeSheetDraft(subjects: string[]) {
  const [subject, setSubject] = useState("");
  const [academicTerm, setAcademicTerm] = useState<AcademicTerm>(1);
  const [maxScoreInput, setMaxScoreInput] = useState("");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const selectedSubject = subjects.includes(subject) ? subject : subjects[0] ?? "";

  const clear = () => {
    setScores({});
    setMaxScoreInput("");
    setEditingSheetId(null);
  };

  const startEditing = (sheet: GradeSheet) => {
    setSubject(sheet.subject);
    setAcademicTerm(sheet.academic_term);
    setMaxScoreInput(String(sheet.max_score));
    setScores(Object.fromEntries(
      sheet.grades.map((grade) => [grade.eleve_id, String(grade.score)]),
    ));
    setEditingSheetId(sheet.id);
  };

  return {
    academicTerm,
    selectedSubject,
    maxScoreInput,
    maxScoreFor: (sheet?: GradeSheet) => maxScoreInput || String(sheet?.max_score ?? 20),
    scores,
    editingSheetId,
    setMaxScoreInput,
    setScores,
    scoreFor: (studentId: string, sheet?: GradeSheet) =>
      scores[studentId] ??
      String(sheet?.grades.find((grade) => grade.eleve_id === studentId)?.score ?? ""),
    startEditing,
    clear,
    changeSubject: (value: string) => {
      setSubject(value);
      clear();
    },
    changeAcademicTerm: (value: AcademicTerm) => {
      setAcademicTerm(value);
      clear();
    },
  };
}
