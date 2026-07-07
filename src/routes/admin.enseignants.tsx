import { useState } from 'react'
import { PageHeader } from '@/components/Dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import type { TeacherUser } from '@/lib/types'
import { Plus, Trash2, Copy, Loader2, Edit3, X } from 'lucide-react'
import { SupabaseErrorHandler } from '@/services/core/Supabase.error.handler'
import { classService } from '@/services/classe/classe.service'
import { useFetchData, useMutateData } from '@/hooks/useQuery'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

function AdminTeachers() {
  const queryClient = useQueryClient()
  const users = useAuthStore(s => s.registeredUsers)
  const createTeacher = useAuthStore(s => s.createTeacher)
  const remove = useAuthStore(s => s.removeUser)

  // Filtrage des enseignants depuis le store global
  const teachers = users.filter((u): u is TeacherUser => u.role === 'teacher')

  // États locaux du formulaire de création
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])

  // ÉTATS POUR LE POPUP (MODAL) DE MODIFICATION
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<TeacherUser | null>(null)
  const [modalSelectedClasses, setModalSelectedClasses] = useState<string[]>([])

  // 1. REQUÊTE : Récupération des classes dynamiques depuis Supabase
  const {
    data: classesData = [],
    isLoading: isLoadingClasses,
    isError: isClassesError,
  } = useFetchData(['classes'], classService.getAllClasses)

  // 2. MUTATION : Création d'un enseignant
  const createTeacherMutation = useMutateData(
    (newTeacher: {
      fullName: string
      email: string
      assignedclasses: string[]
    }) => createTeacher(newTeacher),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['teacher'] })
        toast.success('Enseignant créé avec succès')
        setName('')
        setEmail('')
        setSelectedClasses([])
      },
      onError: err => SupabaseErrorHandler.handle(err),
    }
  )

  // Gestion du toggle des badges (Création)
  const toggleClass = (classId: string) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(x => x !== classId)
        : [...prev, classId]
    )
  }

  // Gestion du toggle des badges (Dans le Popup d'Édition)
  const toggleModalClass = (classId: string) => {
    setModalSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(x => x !== classId)
        : [...prev, classId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    createTeacherMutation.mutate({
      fullName: name,
      email: email,
      assignedclasses: selectedClasses,
    })
  }

  const handleCopyAccessId = (accessId: string) => {
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(accessId)
    toast.success("ID d'accès copié")
  }

  // Ouvre le popup et pré-remplit directement avec le tableau d'IDs existant
  const handleManageClasses = (teacher: TeacherUser) => {
    setEditingTeacher(teacher)
    // Comme ton service renvoie déjà le tableau d'IDs dansassignedClassNames, on l'injecte directement
    setModalSelectedClasses(teacher.assignedclasses || [])
    setIsModalOpen(true)
  }

  return (
    <div className="relative">
      <PageHeader
        title="Enseignants"
        subtitle="Créez des comptes enseignants et attribuez les classes."
      />

      {/* Formulaire de création */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-3xl bg-card border border-border mb-8 space-y-4"
      >
        <h2 className="font-display text-xl">Nouvel enseignant</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            type="text"
            placeholder="Nom complet"
            className="px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
          />
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            required
            placeholder="Email"
            className="px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-primary text-sm"
          />
        </div>

        {/* Section Sélection des Classes Dynamiques */}
        <div>
          <p className="text-xs uppercase tracking-widest opacity-70 mb-2">
            Classes attribuées
          </p>

          {isLoadingClasses ? (
            <div className="flex items-center gap-2 py-2 text-xs opacity-60">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Chargement des classes...</span>
            </div>
          ) : isClassesError ? (
            <p className="text-xs text-destructive py-2">
              Erreur lors de la récupération des classes.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {classesData.map(c => {
                const isSelected = selectedClasses.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleClass(c.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-sacred-red text-white border-sacred-red shadow-sm'
                        : 'border-border opacity-70 hover:opacity-100 bg-background'
                    }`}
                  >
                    {c.nom_classe}
                  </button>
                )
              })}
              {classesData.length === 0 && (
                <p className="text-xs opacity-50 italic">
                  Aucune classe trouvée. Créez d'abord une classe dans l'onglet
                  Classes.
                </p>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={createTeacherMutation.isPending}
          className="px-5 py-2.5 rounded-full bg-sacred-red text-white font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {createTeacherMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          <span>
            {createTeacherMutation.isPending
              ? 'Création...'
              : "Créer l'enseignant"}
          </span>
        </button>
      </form>

      {/* Liste des enseignants */}
      <div className="space-y-3">
        {teachers.map(t => {
          console.log(t)
          // LOGIQUE CORRIGÉE : Filtrer les classes globales dont l'ID est inclus dans les classes du prof
          const teacherClasses = classesData.filter(cls =>
            t.assignedclasses?.includes(cls.id)
          )

          return (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-card border border-border flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{t.fullName}</p>
                  <p className="text-xs opacity-60">{t.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyAccessId(t.teacherAccessId)}
                    className="px-3 py-2 rounded-full border border-border text-xs font-mono flex items-center gap-1.5 hover:bg-muted transition-colors"
                  >
                    <Copy className="size-3" /> {t.teacherAccessId}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      confirm(`Supprimer le compte de ${t.fullName} ?`) &&
                      remove(t.id)
                    }
                    className="size-9 rounded-full border border-border grid place-items-center hover:bg-destructive hover:text-destructive-foreground transition-all"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-4">
                <div className="text-xs opacity-60">
                  <span className="font-medium">Classes associées :</span>{' '}
                  {teacherClasses.length > 0 ? (
                    <span className="font-semibold text-foreground">
                      {teacherClasses.map(c => c.nom_classe).join(', ')}
                    </span>
                  ) : (
                    <span className="italic opacity-50">
                      Aucune classe configurée
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleManageClasses(t)}
                  className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium flex items-center gap-1 hover:bg-muted transition-colors text-primary shrink-0"
                >
                  <Edit3 className="size-3" />
                  <span>Changer les classes</span>
                </button>
              </div>
            </div>
          )
        })}

        {teachers.length === 0 && (
          <p className="text-sm text-center py-12 opacity-50 border border-dashed border-border rounded-2xl">
            Aucun enseignant enregistré pour le moment.
          </p>
        )}
      </div>

      {/* POPUP (MODAL) : MODIFICATION DES CLASSES D'UN PROF */}
      {isModalOpen && editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-card border border-border shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">
                  Modifier les classes
                </h3>
                <p className="text-xs opacity-60">{editingTeacher.fullName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="size-8 rounded-full border border-border grid place-items-center hover:bg-muted transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div>
                <p className="text-xs uppercase tracking-widest opacity-70 mb-3">
                  Sélectionnez les nouvelles classes
                </p>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                  {classesData.map(c => {
                    const isSelected = modalSelectedClasses.includes(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleModalClass(c.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-sacred-red text-white border-sacred-red shadow-sm'
                            : 'border-border opacity-70 hover:opacity-100 bg-background'
                        }`}
                      >
                        {c.nom_classe}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-xs font-medium hover:bg-muted transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-sacred-red text-white text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  <span>Enregistrer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTeachers
