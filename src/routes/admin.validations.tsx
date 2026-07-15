import { useState } from 'react'
import { PageHeader } from '@/components/Dashboard-shell'
import { Check, X, Search, Filter } from 'lucide-react'
import { studentService } from '@/services/student/Student.service'
import { useFetchData, useMutateData } from '@/hooks/useQuery'
import { filterElement } from '@/utils/filterElements'
import { useQueryClient } from '@tanstack/react-query'

function AdminValidations() {
  const queryClient = useQueryClient()

  // États pour la recherche et les filtres
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProvince, setSelectedProvince] = useState('Tous')

  // Récupération sécurisée des données via TanStack Query
  const {
    data: students = [],
    isLoading,
    isError,
  } = useFetchData(['pending-students'], () =>
    studentService.getPendingStudents()
  )

  // Mutation pour mettre à jour le statut (Validation ou Rejet)
  const { mutate: updateStatus, isPending: isUpdating } = useMutateData(
    ({ id, status }: { id: string; status: 'valide' | 'rejete' }) =>
      studentService.updateStudentStatus(id, status),
    {
      onSuccess: () => {
        // Force le rafraîchissement des données en arrière-plan de manière propre
        queryClient.invalidateQueries({ queryKey: ['pending-students'] })
      },
    }
  )

  // Application de ta fonction de filtrage générique
  // Recherche sur le Nom, l'Email et la Classe
  const filteredStudents = filterElement({
    items: students,
    keys: ['lastName', 'firstName', 'middleName', 'currentClassName'],
    searchQuery,
    selectKey: 'province',
    selectedValue: selectedProvince,
  })

  // Extraction dynamique des provinces disponibles pour le filtre select
  const provinces = [
    'Tous',
    ...Array.from(new Set(students.map(s => s.province).filter(Boolean))),
  ]

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <PageHeader title="Validations" subtitle="Chargement des demandes..." />
        <div className="h-32 bg-card rounded-3xl border border-border" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-destructive bg-destructive/10 rounded-2xl border border-destructive/20">
        Une erreur est survenue lors de la récupération des données de
        validation.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Validations"
        subtitle="Approuvez les nouvelles inscriptions élèves."
      />

      {/* Section Filtrage et Recherche */}
      {students.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Recherche textuelle */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 opacity-50" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou classe..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
            />
          </div>

          {/* Sélecteur de Province */}
          <div className="relative min-w-45">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 opacity-50" />
            <select
              value={selectedProvince}
              onChange={e => setSelectedProvince(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm appearance-none cursor-pointer"
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
        <div className="p-12 rounded-3xl bg-card border border-border text-center opacity-60">
          {students.length === 0
            ? 'Aucune inscription en attente.'
            : 'Aucun élève ne correspond à vos critères de recherche.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map(s => (
            <div
              key={s.id}
              className={`p-5 rounded-2xl bg-card border border-border flex items-center justify-between gap-4 transition-opacity ${
                isUpdating ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div>
                <p className="font-semibold">
                  {s.middleName} {s.lastName} {s.firstName}
                </p>
                <p className="text-xs opacity-60">
                  {s.phone} · {s.currentClassName} · {s.province}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={isUpdating}
                  onClick={() => updateStatus({ id: s.id, status: 'valide' })}
                  className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Check className="size-4" /> Valider
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => updateStatus({ id: s.id, status: 'rejete' })}
                  className="px-4 py-2 rounded-full border border-border text-sm font-semibold flex items-center gap-1.5 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <X className="size-4" /> Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminValidations
