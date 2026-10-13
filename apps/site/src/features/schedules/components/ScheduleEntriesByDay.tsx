import type { ScheduleEntry } from "@sacre-coeur/domain/types";
import { SCHOOL_DAYS } from "@sacre-coeur/school-features/schedules/schedule-view";

export function ScheduleEntriesByDay({
  entries,
  searchQuery,
}: {
  entries: ScheduleEntry[];
  searchQuery: string;
}) {
  return (
    <div className="space-y-6">
      {SCHOOL_DAYS.map((day) => {
        const dayEntries = entries
          .filter((entry) => entry.dayOfWeek === day)
          .sort((first, second) => first.startTime.localeCompare(second.startTime));
        if (searchQuery && dayEntries.length === 0) return null;
        return (
          <section key={day} className="space-y-2">
            <h3 className="border-b border-border px-1 pb-1 font-display text-lg opacity-80">{day}</h3>
            <div className="space-y-2">
              {dayEntries.map((entry) => (
                <article key={entry.id} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-4">
                    <div className="min-w-17.5 border-r border-border pr-4 text-center">
                      <p className="text-xs font-semibold opacity-70">{entry.dayOfWeek}</p>
                      <p className="mt-0.5 text-[11px] font-medium opacity-50">{entry.startTime} - {entry.endTime}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{entry.subject}</p>
                      <p className="text-xs opacity-60">
                        Local : {entry.room}{entry.teacherName && ` · Prof : ${entry.teacherName}`}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
      {entries.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm opacity-60">
          Aucun cours planifié trouvé.
        </p>
      )}
    </div>
  );
}
