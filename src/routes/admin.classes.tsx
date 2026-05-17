import { useState } from 'react'
import { PageHeader } from '@/components/dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import { ALL_CLASS_NAMES } from '@/lib/mock-seed'
import type { SchoolClassName, StudentUser } from '@/lib/types'
import { Trash2, ArrowLeft } from 'lucide-react'

function AdminClasses() {
  const users = useAuthStore(s => s.registeredUsers)
  const remove = useAuthStore(s => s.removeUser)
  const [selected, setSelected] = useState<SchoolClassName | null>(null)
  const students = users.filter(
    (u): u is StudentUser => u.role === 'student' && u.isValidatedByAdmin
  )

  if (selected) {
    const list = students.filter(s => s.currentClassName === selected)
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="text-sm opacity-60 hover:opacity-100 flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="size-4" /> Retour aux classes
        </button>
        <PageHeader title={selected} subtitle={`${list.length} élève(s)`} />
        <div className="space-y-2">
          {list.map(s => (
            <div
              key={s.id}
              className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{s.fullName}</p>
                <p className="text-xs opacity-60">{s.email}</p>
              </div>
              <button
                onClick={() =>
                  confirm(`Supprimer ${s.fullName} ?`) && remove(s.id)
                }
                className="size-9 rounded-full border border-border grid place-items-center hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {list.length === 0 && (
            <p className="text-sm opacity-60 text-center py-12">
              Aucun élève dans cette classe.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Classes"
        subtitle="Cliquez sur une classe pour voir les élèves."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_CLASS_NAMES.map(c => {
          const count = students.filter(s => s.currentClassName === c).length
          return (
            <button
              key={c}
              onClick={() => setSelected(c)}
              className="p-6 rounded-3xl bg-card border border-border text-left hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <p className="font-display text-2xl mb-2">{c}</p>
              <p className="text-sm opacity-60">
                {count} élève{count > 1 ? 's' : ''}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default AdminClasses
