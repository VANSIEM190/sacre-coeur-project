import type { FormEvent } from "react";
import { Loader2, Settings2, X } from "lucide-react";

interface SettingFormDialogProps {
  isOpen: boolean;
  newKey: string;
  newLabel: string;
  newDescription: string;
  isSaving: boolean;
  onKeyChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function SettingFormDialog({
  isOpen,
  newKey,
  newLabel,
  newDescription,
  isSaving,
  onKeyChange,
  onLabelChange,
  onDescriptionChange,
  onClose,
  onSubmit,
}: SettingFormDialogProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 rounded-full p-2 opacity-60 transition-colors hover:bg-muted hover:opacity-100"
        >
          <X className="size-5" />
        </button>
        <div className="mb-1 flex items-center gap-3">
          <Settings2 className="size-6 text-primary" />
          <h3 className="font-display text-2xl">Nouveau paramètre</h3>
        </div>
        <p className="mb-6 text-sm opacity-60">
          Définissez une nouvelle règle globale pour l'établissement.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-60">
            Nom du paramètre
            <input
              type="text"
              placeholder="Ex: Période d'Évaluation"
              value={newLabel}
              onChange={(event) => onLabelChange(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm focus:border-primary focus:outline-none"
              autoFocus
              required
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-60">
            Clé système (unique)
            <input
              type="text"
              placeholder="Ex: evaluation_period_active"
              value={newKey}
              onChange={(event) => onKeyChange(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 font-mono text-sm focus:border-primary focus:outline-none"
              required
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-60">
            Description
            <textarea
              placeholder="Expliquez à quoi sert ce paramètre..."
              value={newDescription}
              onChange={(event) => onDescriptionChange(event.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-border bg-background p-4 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
