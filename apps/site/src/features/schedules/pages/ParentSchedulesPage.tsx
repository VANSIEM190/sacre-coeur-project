import { useMemo, useState } from "react";
import { ArrowLeft, Download, Loader2, Search } from "lucide-react";
import { PageHeader } from "@sacre-coeur/ui/layouts/dashboard-shell";
import type { ClassName, ScheduleEntry } from "@sacre-coeur/domain/types";
import { useFetchData } from "@sacre-coeur/data-access/hooks/useQuery";
import { classService } from "@sacre-coeur/data-access/services/classe/classe.service";
import { horraireServices } from "@sacre-coeur/data-access/services/schedule/schedule.service";
import { getCurrentSchoolYear } from "@sacre-coeur/domain/utils/getCurrentSchoolYear";
import { generateSchedulePdf } from "@sacre-coeur/school-features/pdf/generateSchedulePdf";
import { filterScheduleEntries } from "@sacre-coeur/school-features/schedules/schedule-view";
import { ScheduleClassGrid } from "../components/ScheduleClassGrid";
import { ScheduleEntriesByDay } from "../components/ScheduleEntriesByDay";

export default function ParentSchedulesPage() {
  const [selectedClass, setSelectedClass] = useState<ClassName | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const schoolYear = getCurrentSchoolYear();

  const classesQuery = useFetchData<ClassName[]>(["classes"], classService.getAllClasses);
  const scheduleQuery = useFetchData<ScheduleEntry[]>(
    ["schedule", selectedClass?.id],
    () => horraireServices.getSchedule(selectedClass?.id ?? ""),
    { enabled: !!selectedClass?.id },
  );
  const schedule = scheduleQuery.data ?? [];
  const filteredSchedule = useMemo(
    () => filterScheduleEntries(schedule, searchQuery),
    [schedule, searchQuery],
  );

  const goBack = () => {
    setSelectedClass(null);
    setSearchQuery("");
  };

  const downloadSchedule = async () => {
    if (!selectedClass) return;
    setIsDownloading(true);
    try {
      await generateSchedulePdf({ targetClass: selectedClass, schoolYear, schedule });
    } finally {
      setIsDownloading(false);
    }
  };

  if (classesQuery.isLoading) {
    return <div className="flex flex-col items-center justify-center gap-2 py-24"><Loader2 className="size-8 animate-spin text-sacred-red" /><p className="text-sm opacity-60">Chargement de la structure scolaire...</p></div>;
  }
  if (classesQuery.isError) {
    return <p role="alert" className="py-12 text-center text-sm text-destructive">Impossible de charger les classes.</p>;
  }

  if (!selectedClass) {
    return (
      <div>
        <PageHeader title="Horaires de cours" subtitle="Sélectionnez une classe pour consulter son emploi du temps." />
        <ScheduleClassGrid classes={classesQuery.data ?? []} onSelect={setSelectedClass} />
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={goBack} className="mb-4 flex items-center gap-2 text-sm font-medium opacity-60 transition-opacity hover:opacity-100">
        <ArrowLeft className="size-4" /> Retour aux classes
      </button>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title={`Horaire : ${selectedClass.nom_classe}`} subtitle="Consultez et téléchargez l'emploi du temps mis à jour en temps réel." />
        <button
          type="button"
          onClick={downloadSchedule}
          disabled={isDownloading || scheduleQuery.isLoading || scheduleQuery.isError}
          className="flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-primary px-5 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:self-auto"
        >
          {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Télécharger l'horaire (PDF)
        </button>
      </div>

      <label className="relative mb-6 block rounded-3xl border border-border bg-card p-5">
        <Search className="absolute left-9 top-1/2 size-4 -translate-y-1/2 opacity-50" />
        <input
          type="search"
          placeholder="Rechercher un cours par matière, professeur, local, jour..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-11 pr-4 text-sm focus:border-primary focus:outline-none"
        />
      </label>

      {scheduleQuery.isError ? (
        <p role="alert" className="py-12 text-sm text-destructive">Impossible de charger cet emploi du temps.</p>
      ) : scheduleQuery.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin opacity-50" /></div>
      ) : (
        <ScheduleEntriesByDay entries={filteredSchedule} searchQuery={searchQuery} />
      )}
    </div>
  );
}
