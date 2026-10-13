import {
  requireText,
  requireUuid,
  validateAcademicTerm,
  validateGrade,
} from "@sacre-coeur/domain/validation";
import { DomainError } from "@sacre-coeur/domain/errors";
import type { AcademicTerm } from "@sacre-coeur/domain/types";
import { supabase } from "../../supabase/supabaseClient";

export interface GradeEntry {
  eleve_id: string;
  score: number;
}

export interface Grade extends GradeEntry {
  id: string;
  grade_sheet_id: string;
  created_at: string;
  updated_at: string;
}

export interface GradeSheet {
  id: string;
  classe_id: string;
  teacher_id: string;
  subject: string;
  academic_term: AcademicTerm;
  max_score: number;
  school_year: string;
  created_at: string;
  updated_at: string;
  grades: Grade[];
}

export interface GradeSheetInput {
  classe_id: string;
  teacher_id: string;
  subject: string;
  academic_term: AcademicTerm;
  max_score: number;
  school_year: string;
  grades: GradeEntry[];
}

function validateSheet(input: GradeSheetInput): GradeSheetInput {
  requireUuid(input.classe_id, "Identifiant de classe");
  requireUuid(input.teacher_id, "Identifiant de l'enseignant");
  validateAcademicTerm(input.academic_term);
  const subject = requireText(input.subject, "Matière");
  const school_year = requireText(input.school_year, "Année scolaire");
  if (!Number.isFinite(input.max_score) || input.max_score <= 0)
    throw new DomainError("Le point maximum doit être supérieur à zéro.");
  if (!input.grades.length) throw new DomainError("La fiche ne contient aucune note.");

  const seenStudents = new Set<string>();
  const grades = input.grades.map((entry) => {
    requireUuid(entry.eleve_id, "Identifiant de l'élève");
    validateGrade(entry.score, input.max_score);
    if (seenStudents.has(entry.eleve_id))
      throw new DomainError("Un élève apparaît plusieurs fois dans cette fiche.");
    seenStudents.add(entry.eleve_id);
    return { eleve_id: entry.eleve_id, score: entry.score };
  });

  return { ...input, subject, school_year, grades };
}

function mapGradeSheet(sheet: GradeSheet): GradeSheet {
  return {
    ...sheet,
    max_score: Number(sheet.max_score),
    grades: (sheet.grades ?? []).map((grade) => ({
      ...grade,
      score: Number(grade.score),
    })),
  };
}

class GradeService {
  async getTeacherGradeSheets(
    teacherId: string,
    schoolYear: string,
  ): Promise<GradeSheet[]> {
    requireUuid(teacherId, "Identifiant de l'enseignant");
    const { data, error } = await supabase
      .from("grade_sheets")
      .select(
        "id,classe_id,teacher_id,subject,academic_term,max_score,school_year,created_at,updated_at,grades(id,grade_sheet_id,eleve_id,score,created_at,updated_at)",
      )
      .eq("teacher_id", teacherId)
      .eq("school_year", requireText(schoolYear, "Année scolaire"))
      .order("updated_at", { ascending: false })
      .returns<GradeSheet[]>();
    if (error) throw error;
    return (data ?? []).map(mapGradeSheet);
  }

  async saveGradeSheet(input: GradeSheetInput): Promise<string> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new DomainError("Veuillez vous reconnecter.");

    const sheet = validateSheet(input);
    if (sheet.teacher_id !== user.id)
      throw new DomainError("L'enseignant doit correspondre au compte connecté.");

    const { data, error } = await supabase.rpc("save_teacher_grade_sheet", {
      p_classe_id: sheet.classe_id,
      p_subject: sheet.subject,
      p_academic_term: sheet.academic_term,
      p_max_score: sheet.max_score,
      p_school_year: sheet.school_year,
      p_scores: sheet.grades,
    });
    if (error) throw error;
    if (typeof data !== "string")
      throw new DomainError("La fiche n'a pas été enregistrée.");
    return data;
  }

  async deleteGradeSheet(gradeSheetId: string): Promise<void> {
    requireUuid(gradeSheetId, "Identifiant de la fiche");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new DomainError("Veuillez vous reconnecter.");

    const { data, error } = await supabase.rpc("delete_teacher_grade_sheet", {
      p_grade_sheet_id: gradeSheetId,
    });
    if (error) throw error;
    if (data !== true) throw new DomainError("La fiche n'a pas pu être supprimée.");
  }
}

export const gradeService = new GradeService();
