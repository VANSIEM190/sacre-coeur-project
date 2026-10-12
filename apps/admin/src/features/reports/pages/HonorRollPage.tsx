import { useState } from "react";
import { PageHeader } from "@sacre-coeur/ui/layouts/dashboard-shell";
import { useFetchData } from "@sacre-coeur/data-access/hooks/useQuery";
import { adminArchivesServices } from "@sacre-coeur/data-access/services/archive/archive.service";
import { downloadFile } from "@sacre-coeur/data-access/utils/downloadFile";
import { SupabaseErrorHandler } from "@sacre-coeur/school-features/feedback/supabase-error-handler";
import { Trophy, Download, Loader2 } from "lucide-react";
import type { ArchiveDocument } from "@sacre-coeur/domain/types";

export default function HonorRollPage() {
  const {
    data: archives = [],
    isLoading,
    error,
  } = useFetchData(["archives"], () => adminArchivesServices.getArchives());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const honorRolls = archives.filter(
    (archive) => archive.category === "Palmarès",
  );
  const download = async (archive: ArchiveDocument) => {
    setDownloadingId(archive.id);
    try {
      await downloadFile({
        bucket: "sacre-coeur-files-archives",
        filePath: archive.file,
        fileName: `${archive.title}.${archive.file.split(".").pop()}`,
      });
    } catch (downloadError) {
      SupabaseErrorHandler.handle(downloadError);
    } finally {
      setDownloadingId(null);
    }
  };
  return (
    <div>
      <PageHeader
        title="Palmarès annuels"
        subtitle="Documents de fin d'année publiés dans les archives de l'école."
      />
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-sacred-red" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">
            Impossible de charger les palmarès.
          </p>
        ) : (
          honorRolls.map((archive) => (
            <div
              key={archive.id}
              className="p-6 rounded-3xl bg-card border border-border"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-xl bg-sacred-gold/20 text-sacred-gold grid place-items-center">
                  <Trophy className="size-5" />
                </div>
                <p className="font-display text-xl">
                  {archive.title} — {archive.year}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-background border border-border">
                <p className="text-sm opacity-70">
                  {archive.description || "Document de palmarès archivé."}
                </p>
                <button
                  onClick={() => download(archive)}
                  disabled={downloadingId === archive.id}
                  className="size-9 rounded-full border border-border grid place-items-center text-sacred-red disabled:opacity-50"
                  aria-label={`Télécharger ${archive.title}`}
                >
                  {downloadingId === archive.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
        {!isLoading && !error && honorRolls.length === 0 && (
          <div className="p-6 rounded-3xl bg-card border border-border text-sm opacity-60">
            Aucun palmarès publié. Ajoutez un document de catégorie Palmarès
            dans les archives.
          </div>
        )}
      </div>
    </div>
  );
}
