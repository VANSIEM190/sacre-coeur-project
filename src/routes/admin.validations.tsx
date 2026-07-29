import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/Dashboard-shell'
import { Check, X, Search, Filter, Loader2 } from 'lucide-react'
import { studentService } from '@/services/student/Student.service'
import { useFetchData, useMutateData } from '@/hooks/useQuery'
import { filterElement } from '@/utils/filterElements'
import { useQueryClient } from '@tanstack/react-query'
import type { EleveDetails } from '@/lib/types'
import { SupabaseErrorHandler } from '@/services/core/Supabase.error.handler'

function AdminValidations() {
  const queryClient = useQueryClient()

  // États pour la recherche, le filtre et l'élément en cours d'action
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProvince, setSelectedProvince] = useState('Tous')
  const [activeInscriptionId, setActiveInscriptionId] = useState<string | null>(
    null
  )

  // 1. Récupération des élèves
  const {
    data: allStudents = [],
    isLoading,
    isError,
  } = useFetchData<EleveDetails[]>(['pending-students'], () =>
    studentService.getAllStudents()
  )

  // 2. Filtrer uniquement les inscriptions en attente
  const pendingStudents = useMemo(() => {
    return allStudents.filter(s => s.status === 'en_attente')
  }, [allStudents])

  // 3. Mutation pour mettre à jour le statut
  const { mutate: updateStatus, isPending: isUpdating } = useMutateData(
    ({
      inscriptionId,
      status,
    }: {
      inscriptionId: string
      status: 'accepte' | 'rejete'
    }) => studentService.updateStudentStatus({ inscriptionId, status }),
    {
      onSuccess: () => {
        // Rafraîchissement des requêtes TanStack
        queryClient.invalidateQueries({ queryKey: ['pending-students'] })
        queryClient.invalidateQueries({ queryKey: ['all-students'] })
        setActiveInscriptionId(null)
      },
      onError: err => {
        SupabaseErrorHandler.handle(err)
        setActiveInscriptionId(null)
      },
    }
  )

  // 4. Filtrage dynamique (Recherche par nom/prénom + filtre par province)
  const filteredStudents = filterElement({
    items: pendingStudents,
    keys: ['lastName', 'firstName', 'middleName'],
    searchQuery,
    selectKey: 'province',
    selectedValue: selectedProvince,
  })

  // Extraction dynamique des provinces
  const provinces = useMemo(() => {
    return [
      'Tous',
      ...Array.from(
        new Set(pendingStudents.map(s => s.province).filter(Boolean))
      ),
    ]
  }, [pendingStudents])

  const handleAction = (
    inscriptionId: string,
    status: 'accepte' | 'rejete'
  ) => {
    setActiveInscriptionId(inscriptionId)
    updateStatus({ inscriptionId, status })
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <PageHeader title="Validations" subtitle="Chargement des demandes..." />
        <div className="h-28 sm:h-32 bg-card rounded-2xl sm:rounded-3xl border border-border" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-6 text-center text-destructive bg-destructive/10 rounded-2xl border border-destructive/20 text-xs sm:text-sm font-medium">
        Une erreur est survenue lors de la récupération des données de
        validation.
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-full overflow-hidden">
      <PageHeader
        title="Validations"
        subtitle="Approuvez les nouvelles inscriptions d'élèves en attente."
      />

      {/* Section Filtrage et Recherche */}
      {pendingStudents.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Recherche textuelle */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 opacity-50" />
            <input
              type="text"
              placeholder="Rechercher par nom ou prénom..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm transition-all"
            />
          </div>

          {/* Sélecteur de Province */}
          <div className="relative min-w-40 sm:min-w-45">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 opacity-50 pointer-events-none" />
            <select
              value={selectedProvince}
              onChange={e => setSelectedProvince(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm appearance-none cursor-pointer"
            >
              {provinces.map(prov => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Liste des étudiants */}
      {filteredStudents.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-2xl sm:rounded-3xl bg-card border border-border text-center opacity-60 text-xs sm:text-sm font-medium">
          {pendingStudents.length === 0
            ? 'Aucune inscription en attente de validation.'
            : 'Aucun élève ne correspond à vos critères de recherche.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map(s => {
            const inscriptionId = s.inscription_id
            const isItemUpdating =
              isUpdating && activeInscriptionId === inscriptionId

            return (
              <div
                key={s.id}
                className={`p-4 sm:p-5 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isItemUpdating ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                {/* Infos Élève */}
                <div className="space-y-1">
                  <p className="font-semibold text-sm sm:text-base leading-tight">
                    {s.lastName} {s.middleName} {s.firstName}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs opacity-60 font-medium">
                    <span>{s.nom_classe || 'Classe non assignée'}</span>
                    <span>•</span>
                    <span>{s.province || 'Province N/C'}</span>
                    {s.phone && (
                      <>
                        <span>•</span>
                        <span>{s.phone}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Boutons d'Action */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    disabled={isUpdating || !inscriptionId}
                    onClick={() =>
                      inscriptionId && handleAction(inscriptionId, 'accepte')
                    }
                    className="px-3.5 sm:px-4 py-2 rounded-xl sm:rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isItemUpdating ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    Valider
                  </button>

                  <button
                    disabled={isUpdating || !inscriptionId}
                    onClick={() =>
                      inscriptionId && handleAction(inscriptionId, 'rejete')
                    }
                    className="px-3.5 sm:px-4 py-2 rounded-xl sm:rounded-full border border-border text-xs sm:text-sm font-semibold flex items-center gap-1.5 hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isItemUpdating ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <X className="size-4" />
                    )}
                    Refuser
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AdminValidations
