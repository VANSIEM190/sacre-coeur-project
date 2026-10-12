import type { Day, ScheduleEntry } from "@sacre-coeur/domain/types";

export const SCHOOL_DAYS: Day[] = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

export function filterScheduleEntries(
  entries: ScheduleEntry[],
  search: string,
): ScheduleEntry[] {
  const query = search.trim().toLocaleLowerCase("fr-FR");
  return entries.filter((entry) =>
    [entry.subject, entry.room, entry.dayOfWeek, entry.teacherName].some(
      (value) => value?.toLocaleLowerCase("fr-FR").includes(query),
    ),
  );
}
