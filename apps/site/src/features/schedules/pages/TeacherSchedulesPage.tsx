import { useMemo, useState } from "react";
import { PageHeader } from "@sacre-coeur/ui/layouts/dashboard-shell";
import { ArrowDownToLine, Loader2, Search } from "lucide-react";
import type { ScheduleEntry } from "@sacre-coeur/domain/types";
import { generateSchedulePdf } from "@sacre-coeur/school-features/pdf/generateSchedulePdf";
import {
  filterScheduleEntries,
} from "@sacre-coeur/school-features/schedules/schedule-view";
import { SupabaseErrorHandler } from "@sacre-coeur/school-features/feedback/supabase-error-handler";
import { useTeacherSchedule } from "../hooks/useTeacherSchedule";
import { ScheduleEntriesByDay } from "../components/ScheduleEntriesByDay";

const EMPTY_SCHEDULE: ScheduleEntry[] = [];

export default function TeacherSchedulesPage() {
  const {
    teacher,
    schoolYear,
    assignedClasses,
    isLoading,
    error,
    scheduleQuery,
  } = useTeacherSchedule();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const schedule = scheduleQuery.data ?? EMPTY_SCHEDULE;
  const selectedClass =
    assignedClasses.find((schoolClass) => schoolClass.id === selectedClassId) ??
    assignedClasses[0];
  const classSchedule = useMemo(
    () =>
      selectedClass
        ? schedule.filter((entry) => entry.classe_id === selectedClass.id)
        : [],
    [schedule, selectedClass],
  );
  const filteredSchedule = useMemo(
    () => filterScheduleEntries(classSchedule, searchQuery),
    [classSchedule, searchQuery],
  );

  const downloadSchedule = async () => {
    if (!selectedClass) return;
    setIsDownloading(true);
    try {
      await generateSchedulePdf({
        targetClass: selectedClass,
        schoolYear,
        schedule: classSchedule,
      });
    } catch (downloadError) {
      SupabaseErrorHandler.handle(downloadError);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="size-7 animate-spin" />
      </div>
    );
  if (error)
    return (
      <p
        role="alert"
        className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive"
      >
        Impossible de charger vos classes ou votre emploi du temps.
      </p>
    );

  return (
    <section className="space-y-6">
      <PageHeader
        title="Mes horaires"
        subtitle="Les cours affichés sont associés à votre compte via les horaires de vos classes."
      />
      {!assignedClasses.length ? (
        <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
          Aucune classe ne vous est attribuée pour l’année scolaire {schoolYear}
          . Contactez l’administration.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <label className="grid min-w-56 gap-1 text-sm font-medium">
              Classe
              <select
                value={selectedClass?.id ?? ""}
                onChange={(event) => setSelectedClassId(event.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2"
              >
                {assignedClasses.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.nom_classe}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => void downloadSchedule()}
              disabled={isDownloading || !classSchedule.length}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowDownToLine className="size-4" />
              )}
              Télécharger en PDF
            </button>
          </div>
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher une matière ou une salle"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
            />
          </label>
          {scheduleQuery.isLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : scheduleQuery.error ? (
            <p role="alert" className="text-sm text-destructive">
              Impossible de charger les cours de cette classe.
            </p>
          ) : (
            <ScheduleEntriesByDay entries={filteredSchedule} searchQuery={searchQuery} />
          )}
        </>
      )}
      {teacher && (
        <span className="sr-only">Compte professeur : {teacher.fullName}</span>
      )}
    </section>
  );
}
