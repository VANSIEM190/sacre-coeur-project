import {
  Calendar,
  FileDown,
  GraduationCap,
  Ticket,
  User,
  UserPlus,
} from "lucide-react";
import type { EleveDetails } from "@sacre-coeur/domain/types";
import type { useStudentProfile } from "../hooks/useStudentProfile";

type StudentSummaryCardProps = {
  student: EleveDetails;
  currentSchoolYear: string;
  isAdmin: boolean;
  totals: ReturnType<typeof useStudentProfile>["totals"];
  onDownloadReport: () => void;
  onOpenReenrollment: () => void;
};

const getStudentFullName = (student: EleveDetails) =>
  [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");

export default function StudentSummaryCard({
  student,
  currentSchoolYear,
  isAdmin,
  totals,
  onDownloadReport,
  onOpenReenrollment,
}: StudentSummaryCardProps) {
  return (
    <section className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border flex flex-col lg:flex-row justify-between gap-5 sm:gap-6 items-start lg:items-center">
      <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto min-w-0">
        <div className="size-12 sm:size-16 rounded-2xl bg-sacred-red/10 text-sacred-red grid place-items-center shrink-0">
          <User className="size-6 sm:size-8" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm sm:text-xl font-bold tracking-tight truncate">
            {getStudentFullName(student)}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs sm:text-sm opacity-70">
            <span className="flex items-center gap-1">
              <GraduationCap className="size-4 shrink-0" />
              {student.currentClassName || "Classe non assignée"}
            </span>
            <span className="size-1 bg-border rounded-full hidden sm:inline" />
            <span className="flex items-center gap-1">
              <Calendar className="size-4 shrink-0" />
              Année : {currentSchoolYear}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full lg:w-auto">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-2xl bg-background border border-border/60 text-center sm:text-left min-w-0">
            <p className="text-[11px] sm:text-xs opacity-50 font-medium truncate">
              Total payé (USD)
            </p>
            <p className="text-base sm:text-lg font-bold text-foreground mt-0.5 truncate">
              {totals.USD} USD
            </p>
          </div>
          <div className="p-3 sm:p-4 rounded-2xl bg-background border border-border/60 text-center sm:text-left min-w-0">
            <p className="text-[11px] sm:text-xs opacity-50 font-medium truncate">
              Total payé (FC)
            </p>
            <p className="text-base sm:text-lg font-bold text-foreground mt-0.5 truncate">
              {totals.FC} FC
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
          <button
            onClick={onDownloadReport}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-border font-semibold hover:bg-muted transition-all active:scale-[0.98] shrink-0 w-full sm:w-auto"
          >
            <FileDown className="size-5 shrink-0" />
            Rapport PDF
          </button>

          {!isAdmin && (
            <>
              <button
                disabled
                title="Le billet de vacances n'est pas disponible dans le projet."
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-border font-semibold hover:bg-muted transition-all active:scale-[0.98] shrink-0 w-full sm:w-auto"
              >
                <Ticket className="size-5 shrink-0" />
                Billet de vacances
              </button>
              <button
                onClick={onOpenReenrollment}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sacred-red text-white font-semibold shadow-md hover:bg-sacred-red/90 transition-all active:scale-[0.98] shrink-0 w-full sm:w-auto"
              >
                <UserPlus className="size-5 shrink-0" />
                Réinscription
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
