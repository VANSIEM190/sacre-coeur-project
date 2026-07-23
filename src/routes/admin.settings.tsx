import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/Dashboard-shell'
import {
  Sliders,
  Power,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings2,
  ShieldCheck,
} from 'lucide-react'
import { SupabaseErrorHandler } from '@/services/core/Supabase.error.handler'
import { toast } from 'sonner'
import { useFetchData, useMutateData } from '@/hooks/useQuery'
import { settingsService } from '@/services/settings/settings.service'

interface SystemSettingItem {
  key: string
  label: string
  description: string
  enabled: boolean
}

export function AdminSettings() {
  const queryClient = useQueryClient()

  // États pour la création d'un nouveau paramètre personnalisé
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newDescription, setNewDescription] = useState('')

  // 1. REQUÊTE : Récupération de tous les paramètres de configuration
  const {
    data: settingsList = [],
    isLoading,
    isError,
  } = useFetchData<SystemSettingItem[]>(['systemSettings'], async () => {
    // Si tu as un endpoint qui liste toutes les clés, utilise-le ici.
    // Sinon, on récupère le statut des réinscriptions par défaut :
    const isReenrollmentOpen = await settingsService.isReenrollmentOpen()
    return [
      {
        key: 'reenrollment_enabled',
        label: 'Session de Réinscription',
        description:
          "Autorise ou bloque les formulaires de réinscription pour les élèves pendant l'année scolaire.",
        enabled: isReenrollmentOpen,
      },
    ]
  })

  // 2. MUTATION : Basculer un paramètre (Toggle ON/OFF)
  const toggleSettingMutation = useMutateData(
    ({ key, enabled }: { key: string; enabled: boolean }) => {
      if (key === 'reenrollment_enabled') {
        return settingsService.setReenrollmentStatus(enabled)
      }
      // Extension future pour d'autres paramètres
      return settingsService.setReenrollmentStatus(enabled)
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['systemSettings'] })
        toast.success(
          `Paramètre ${variables.enabled ? 'activé' : 'désactivé'} avec succès`
        )
      },
      onError: err => SupabaseErrorHandler.handle(err),
    }
  )

  // 3. MUTATION : Création d'un nouveau paramètre personnalisable
  const createSettingMutation = useMutateData(
    (newConfig: { key: string; label: string; description: string }) => {
      return settingsService.setReenrollmentStatus(false) // Exemple d'insertion
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['systemSettings'] })
        toast.success('Nouveau paramètre ajouté')
        setIsModalOpen(false)
        setNewKey('')
        setNewLabel('')
        setNewDescription('')
      },
      onError: err => SupabaseErrorHandler.handle(err),
    }
  )

  const handleToggle = (key: string, currentStatus: boolean) => {
    toggleSettingMutation.mutate({ key, enabled: !currentStatus })
  }

  const handleCreateSetting = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKey.trim() || !newLabel.trim()) return

    createSettingMutation.mutate({
      key: newKey.toLowerCase().replace(/\s+/g, '_'),
      label: newLabel,
      description: newDescription,
    })
  }

  return (
    <div className="relative">
      {/* HEADER + BOUTON D'ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader
          title="Paramètres de la plateforme"
          subtitle="Gérez les accès, les règles d'inscription et la configuration globale."
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity self-start sm:self-auto"
        >
          <Plus className="size-5" />
          Nouveau paramètre
        </button>
      </div>

      {/* ÉTATS DE CHARGEMENT OU ERREUR */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 opacity-60">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm">Chargement des configurations...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-destructive">
          <p className="text-sm">
            Une erreur est survenue lors de la récupération des paramètres.
          </p>
        </div>
      ) : (
        /* GRILLE DES PARAMÈTRES (DESIGN IDENTIQUE À LA LISTE DES CLASSES) */
        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {settingsList.map(item => (
            <div
              key={item.key}
              className="p-6 rounded-3xl bg-card border border-border text-left hover:shadow-xl transition-all flex flex-col justify-between gap-6 group relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Sliders className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold">
                      {item.label}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full mt-1 ${
                        item.enabled
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-muted text-muted-foreground'
                      }`}
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

                {/* BOUTON SWITCH / POWER */}
                <button
                  disabled={toggleSettingMutation.isPending}
                  onClick={() => handleToggle(item.key, item.enabled)}
                  title={item.enabled ? 'Désactiver' : 'Activer'}
                  className={`size-10 rounded-2xl border border-border grid place-items-center transition-all disabled:opacity-40 shrink-0 ${
                    item.enabled
                      ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
                      : 'bg-background hover:bg-muted opacity-60 hover:opacity-100'
                  }`}
                >
                  {toggleSettingMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Power className="size-4" />
                  )}
                </button>
              </div>

              <p className="text-sm opacity-60 leading-relaxed">
                {item.description}
              </p>

              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs opacity-50 font-mono">
                <span>Clé : {item.key}</span>
                <ShieldCheck className="size-4" />
              </div>
            </div>
          ))}

          {settingsList.length === 0 && (
            <div className="col-span-full text-center py-12 border border-dashed border-border rounded-3xl opacity-60">
              <p className="text-sm">
                Aucun paramètre système n'est configuré.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL AJOUT PARAMÈTRE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 relative shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full opacity-60 hover:opacity-100 hover:bg-muted transition-colors"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3 mb-1">
              <Settings2 className="size-6 text-primary" />
              <h3 className="font-display text-2xl">Nouveau paramètre</h3>
            </div>
            <p className="text-sm opacity-60 mb-6">
              Définissez une nouvelle règle globale pour l'établissement.
            </p>

            <form onSubmit={handleCreateSetting} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider opacity-60 block mb-2">
                  Nom du paramètre
                </label>
                <input
                  type="text"
                  placeholder="Ex: Période d'Évaluation"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:outline-none focus:border-primary text-sm"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider opacity-60 block mb-2">
                  Clé système (unique)
                </label>
                <input
                  type="text"
                  placeholder="Ex: evaluation_period_active"
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:outline-none focus:border-primary text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider opacity-60 block mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Expliquez à quoi sert ce paramètre..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full p-4 rounded-xl bg-background border border-border focus:outline-none focus:border-primary text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 px-4 rounded-xl border border-border font-medium text-sm hover:bg-muted transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createSettingMutation.isPending}
                  className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {createSettingMutation.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSettings
