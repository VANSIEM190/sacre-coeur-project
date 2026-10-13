import { FileSpreadsheet, FileText, Loader2, Pencil, Trash2 } from "lucide-react";
import type { TeacherGradeSheetSummary } from "../hooks/useTeacherGradeSheet";

interface GradeSheetListProps {
  sheets: TeacherGradeSheetSummary[];
  isDeleting: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string, format: "excel" | "pdf") => void;
}

export function GradeSheetList({ sheets, isDeleting, onEdit, onDelete, onExport }: GradeSheetListProps) {
  return (
    <div className="space-y-3">
      {sheets.map((sheet) => (
        <article key={sheet.id} className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-semibold">
                {sheet.subject} — {sheet.className} · Période {sheet.academicTerm}
              </p>
              <p className="text-xs opacity-60 mt-1">
                Barème : {sheet.maxScore} points · {sheet.entriesCount} élèves · mise à jour le{" "}
                {new Date(sheet.updatedAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onEdit(sheet.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm"
              >
                <Pencil className="size-4" /> Modifier
              </button>
              <button
                type="button"
                onClick={() => onExport(sheet.id, "excel")}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm"
                aria-label={`Télécharger la fiche ${sheet.subject} au format Excel CSV`}
              >
                <FileSpreadsheet className="size-4" /> Excel
              </button>
              <button
                type="button"
                onClick={() => onExport(sheet.id, "pdf")}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm"
              >
                <FileText className="size-4" /> PDF
              </button>
              <button
                type="button"
                onClick={() => onDelete(sheet.id)}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-3 py-2 text-sm text-destructive disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Supprimer
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
