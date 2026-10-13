import { classService } from "@sacre-coeur/data-access/services/classe/classe.service";
import type { GradeSheet } from "@sacre-coeur/data-access/services/grade/grade.service";
import { downloadGradeSheetExcel } from "@sacre-coeur/school-features/pdf/downloadGradeSheetExcel";
import { generateGradeSheetPdf } from "@sacre-coeur/school-features/pdf/generateGradeSheetPdf";
import type { ClassName } from "@sacre-coeur/domain/types";

export async function exportTeacherGradeSheet(
  sheet: GradeSheet,
  classes: ClassName[],
  schoolYear: string,
  format: "excel" | "pdf",
): Promise<void> {
  const roster = await classService.getTeacherStudentsInClass(sheet.classe_id, schoolYear);
  const namesById = new Map(roster.map((student) => [
    student.id,
    [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" "),
  ]));
  const exportData = {
    className:
      classes.find((schoolClass) => schoolClass.id === sheet.classe_id)?.nom_classe ?? "Classe",
    subject: sheet.subject,
    academicTerm: sheet.academic_term,
    schoolYear,
    maxScore: sheet.max_score,
    students: sheet.grades.map((grade) => ({
      name: namesById.get(grade.eleve_id) || `Élève ${grade.eleve_id.slice(0, 8)}`,
      score: grade.score,
    })),
  };

  if (format === "pdf") await generateGradeSheetPdf(exportData);
  else downloadGradeSheetExcel(exportData);
}
