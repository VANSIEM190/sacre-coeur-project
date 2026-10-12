import type { Day, ScheduleEntry } from "@sacre-coeur/domain/types";
import { DomainError } from "@sacre-coeur/domain/errors";
import {
  isValidUuid,
  requireText,
  requireUuid,
} from "@sacre-coeur/domain/validation";
import {
  validateTimeRange,
  timeRangesOverlap,
} from "@sacre-coeur/domain/utils/scheduleRules";
import { parseAssignedClassIds } from "@sacre-coeur/domain/teachers";
import { supabase } from "../../supabase/supabaseClient";

type ScheduleInput = Omit<ScheduleEntry, "id" | "created_at">;
type ScheduleUpdate = Partial<Omit<ScheduleInput, "classe_id">>;
interface TeacherCourse {
  id: string;
  subject: string;
}
const DAYS: Day[] = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

function mapEntry(entry: ScheduleEntry): ScheduleEntry {
  return {
    ...entry,
    startTime: entry.startTime.slice(0, 5),
    endTime: entry.endTime.slice(0, 5),
  };
}
function sortSchedule(entries: ScheduleEntry[]): ScheduleEntry[] {
  return entries.sort(
    (first, second) =>
      DAYS.indexOf(first.dayOfWeek) - DAYS.indexOf(second.dayOfWeek) ||
      first.startTime.localeCompare(second.startTime),
  );
}
function validateEntry(entry: ScheduleInput): ScheduleInput {
  requireUuid(entry.classe_id, "Identifiant de classe");
  if (entry.teacher_id !== null)
    requireUuid(entry.teacher_id, "Identifiant de l'enseignant");
  if (!DAYS.includes(entry.dayOfWeek))
    throw new DomainError("Jour de la semaine invalide.");
  validateTimeRange(entry.startTime, entry.endTime);
  return {
    ...entry,
    subject: requireText(entry.subject, "Matière"),
    room: entry.room.trim(),
    teacherName: entry.teacherName?.trim() || null,
  };
}

class ScheduleService {
  private async ensureTeacherAssignedToClass(
    teacherId: string,
    classId: string,
  ): Promise<void> {
    const { data, error } = await supabase
      .from("enseignants_details")
      .select("assignedclasses")
      .eq("id", teacherId)
      .single();
    if (error) throw error;
    if (!parseAssignedClassIds(data.assignedclasses).includes(classId)) {
      throw new DomainError(
        "Attribuez d’abord cette classe à l’enseignant dans la page Enseignants.",
      );
    }
  }

  private async ensureNoConflict(
    entry: ScheduleInput,
    excludedId?: string,
  ): Promise<void> {
    // UUID contrôlés avant l'expression PostgREST ; une classe et un enseignant ont chacun une seule période simultanée.
    let query = supabase
      .from("schedule_entries")
      .select("id,startTime,endTime")
      .eq("dayOfWeek", entry.dayOfWeek);
    query = entry.teacher_id
      ? query.or(
          "classe_id.eq." +
            entry.classe_id +
            ",teacher_id.eq." +
            entry.teacher_id,
        )
      : query.eq("classe_id", entry.classe_id);
    if (excludedId) query = query.neq("id", excludedId);
    const { data, error } = await query;
    if (error) throw error;
    if ((data ?? []).some((period) => timeRangesOverlap(entry, period))) {
      throw new DomainError(
        "Un créneau existe déjà sur cette plage horaire pour cette classe ou cet enseignant.",
      );
    }
  }

  async getSchedule(classeId: string): Promise<ScheduleEntry[]> {
    requireUuid(classeId, "Identifiant de classe");
    const { data, error } = await supabase
      .from("schedule_entries")
      .select("*")
      .eq("classe_id", classeId);
    if (error) throw error;
    return sortSchedule((data ?? []).map(mapEntry));
  }

  /** schedule_entries.teacher_id désigne enseignants_details.id. */
  async getTeacherSchedule(teacherId: string): Promise<ScheduleEntry[]> {
    requireUuid(teacherId, "Identifiant de l'enseignant");
    const { data, error } = await supabase
      .from("schedule_entries")
      .select("*")
      .eq("teacher_id", teacherId);
    if (error) throw error;
    return sortSchedule((data ?? []).map(mapEntry));
  }

  getTeacherCoursesInClass = async (
    teacherId: string,
    classId: string,
  ): Promise<TeacherCourse[]> => {
    if (!isValidUuid(teacherId) || !isValidUuid(classId)) return [];
    const { data, error } = await supabase
      .from("schedule_entries")
      .select("id,subject")
      .eq("classe_id", classId)
      .eq("teacher_id", teacherId);
    if (error) throw error;
    const seen = new Set<string>();
    return (data ?? []).filter((course) => {
      if (!course.subject || seen.has(course.subject)) return false;
      seen.add(course.subject);
      return true;
    });
  };

  async createScheduleEntry(values: ScheduleInput): Promise<ScheduleEntry> {
    if (!values.teacher_id) throw new DomainError("L'enseignant est requis.");
    const entry = validateEntry(values);
    await this.ensureTeacherAssignedToClass(entry.teacher_id!, entry.classe_id);
    await this.ensureNoConflict(entry);
    const { data, error } = await supabase
      .from("schedule_entries")
      .insert({
        classe_id: entry.classe_id,
        teacher_id: entry.teacher_id,
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        subject: entry.subject,
        room: entry.room,
        teacherName: entry.teacherName,
      })
      .select()
      .single();
    if (error) throw error;
    return mapEntry(data);
  }

  async updateScheduleEntry(
    id: string,
    updates: ScheduleUpdate,
  ): Promise<ScheduleEntry> {
    requireUuid(id, "Identifiant de période");
    const payload: ScheduleUpdate = {};
    for (const key of [
      "dayOfWeek",
      "startTime",
      "endTime",
      "subject",
      "room",
      "teacherName",
      "teacher_id",
    ] as const) {
      if (updates[key] !== undefined)
        Object.assign(payload, { [key]: updates[key] });
    }
    if (!Object.keys(payload).length)
      throw new DomainError("Aucune modification à appliquer.");
    const { data: current, error: fetchError } = await supabase
      .from("schedule_entries")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError) throw fetchError;
    const entry = validateEntry({ ...current, ...payload });
    if (!entry.teacher_id) throw new DomainError("L'enseignant est requis.");
    await this.ensureTeacherAssignedToClass(entry.teacher_id, entry.classe_id);
    await this.ensureNoConflict(entry, id);
    const { data, error } = await supabase
      .from("schedule_entries")
      .update({
        teacher_id: entry.teacher_id,
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        subject: entry.subject,
        room: entry.room,
        teacherName: entry.teacherName,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapEntry(data);
  }

  async deleteScheduleEntry(id: string): Promise<boolean> {
    requireUuid(id, "Identifiant de période");
    const { error } = await supabase
      .from("schedule_entries")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  }
}

export const horraireServices = new ScheduleService();
export const scheduleService = horraireServices;
