import type { Course } from "@sacre-coeur/domain/types";
import { DomainError } from "@sacre-coeur/domain/errors";
import { requireText, requireUuid } from "@sacre-coeur/domain/validation";
import { supabase } from "../../supabase/supabaseClient";
import { nanoid } from "nanoid";

type CourseFields = Omit<Course, "id" | "uploadedAt" | "pdfUrl">;
type CourseInput = Partial<CourseFields> & { pdfUrl?: File };
const BUCKET = "sacre-coeur-files-courses";
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "application/pdf": ["pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    "docx",
  ],
};

async function uploadCourseFile(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !ALLOWED_MIME_TYPES[file.type]?.includes(extension))
    throw new DomainError("Format de fichier non autorisé.");
  if (!file.size || file.size > 10 * 1024 * 1024)
    throw new DomainError(
      "Le fichier doit être non vide et inférieur ou égal à 10 Mo.",
    );
  const path = "courses/" + nanoid() + "." + extension;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "1800", upsert: false });
  if (error) throw error;
  return data.path;
}

async function cleanStorage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error)
    console.error("[CourseService] Fichier orphelin à nettoyer :", path, error);
}

class CourseService {
  async getCourses(classIds?: string[]): Promise<Course[]> {
    if (classIds && !classIds.length) return [];
    let query = supabase
      .from("courses")
      .select("*")
      .order("uploadedAt", { ascending: false });
    if (classIds) {
      classIds.forEach((classId) =>
        requireUuid(classId, "Identifiant de classe"),
      );
      query = query.in("class_id", classIds);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async createCourse(values: CourseInput): Promise<string> {
    requireUuid(values.class_id ?? "", "Identifiant de classe");
    const title = requireText(values.title ?? "", "Titre");
    if (!values.pdfUrl)
      throw new DomainError("Le fichier du cours est obligatoire.");
    const path = await uploadCourseFile(values.pdfUrl);
    try {
      const { data, error } = await supabase
        .from("courses")
        .insert({
          title,
          description: values.description?.trim() ?? "",
          class_id: values.class_id,
          pdfUrl: path,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    } catch (error) {
      await cleanStorage(path);
      throw error;
    }
  }

  async updateCourse(id: string, values: CourseInput): Promise<void> {
    requireUuid(id, "Identifiant du cours");
    const fields: Partial<CourseFields> = {};
    if (values.title !== undefined)
      fields.title = requireText(values.title, "Titre");
    if (values.description !== undefined)
      fields.description = values.description.trim();
    if (values.class_id !== undefined) {
      requireUuid(values.class_id, "Identifiant de classe");
      fields.class_id = values.class_id;
    }
    if (!Object.keys(fields).length && !values.pdfUrl)
      throw new DomainError("Aucune modification à appliquer.");
    const { data: current, error: fetchError } = await supabase
      .from("courses")
      .select("pdfUrl")
      .eq("id", id)
      .single();
    if (fetchError) throw fetchError;
    const path = values.pdfUrl ? await uploadCourseFile(values.pdfUrl) : null;
    const { error } = await supabase
      .from("courses")
      .update({ ...fields, ...(path ? { pdfUrl: path } : {}) })
      .eq("id", id);
    if (error) {
      if (path) await cleanStorage(path);
      throw error;
    }
    if (path && current.pdfUrl) await cleanStorage(current.pdfUrl);
  }

  async deleteCourse(payload: {
    courseId: string;
    filePath: string;
  }): Promise<void> {
    requireUuid(payload.courseId, "Identifiant du cours");
    const { data: current, error: fetchError } = await supabase
      .from("courses")
      .select("pdfUrl")
      .eq("id", payload.courseId)
      .single();
    if (fetchError) throw fetchError;
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", payload.courseId);
    if (error) throw error;
    if (current.pdfUrl) await cleanStorage(current.pdfUrl);
  }
}

export const adminCoursesServices = new CourseService();
