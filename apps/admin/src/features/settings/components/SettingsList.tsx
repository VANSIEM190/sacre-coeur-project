import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Power,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import type { SystemSettingItem } from "../types/system-setting";

interface SettingsListProps {
  settings: SystemSettingItem[];
  isLoading: boolean;
  isError: boolean;
  isSaving: boolean;
  onToggle: (key: string, enabled: boolean) => void;
}

export function SettingsList({
  settings,
  isLoading,
  isError,
  isSaving,
  onToggle,
}: SettingsListProps) {
  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 opacity-60">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm">Chargement des configurations...</p>
      </div>
    );
  if (isError)
    return (
      <div className="py-12 text-center text-destructive">
        <p className="text-sm">
          Une erreur est survenue lors de la récupération des paramètres.
        </p>
      </div>
    );
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {settings.map((item) => (
        <article
          key={item.key}
          className="group relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all hover:shadow-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Sliders className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold">
                  {item.label}
                </h3>
                <span
                  className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${item.enabled ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}
                >
                  {item.enabled ? (
                    <>
                      <CheckCircle2 className="size-3" /> Actif
                    </>
                  ) : (
                    <>
                      <AlertCircle className="size-3" /> Inactif
                    </>
                  )}
                </span>
              </div>
            </div>
            <button
              disabled={isSaving}
              onClick={() => onToggle(item.key, !item.enabled)}
              title={item.enabled ? "Désactiver" : "Activer"}
              className={`grid size-10 shrink-0 place-items-center rounded-2xl border border-border transition-all disabled:opacity-40 ${item.enabled ? "border-emerald-600 bg-emerald-500 text-white hover:bg-emerald-600" : "bg-background opacity-60 hover:bg-muted hover:opacity-100"}`}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Power className="size-4" />
              )}
            </button>
          </div>
          <p className="text-sm leading-relaxed opacity-60">
            {item.description}
          </p>
          <div className="flex items-center justify-between border-t border-border/50 pt-2 font-mono text-xs opacity-50">
            <span>Clé : {item.key}</span>
            <ShieldCheck className="size-4" />
          </div>
        </article>
      ))}
      {settings.length === 0 && (
        <div className="col-span-full rounded-3xl border border-dashed border-border py-12 text-center opacity-60">
          <p className="text-sm">Aucun paramètre système n'est configuré.</p>
        </div>
      )}
    </div>
  );
}
