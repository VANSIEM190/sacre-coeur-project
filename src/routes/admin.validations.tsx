import { PageHeader } from '@/components/dashboard-shell'
import { useAuthStore } from '@/stores/auth-store'
import { Check, X } from 'lucide-react'

function AdminValidations() {
  const users = useAuthStore(s => s.registeredUsers)
  const upsert = useAuthStore(s => s.upsertUser)
  const remove = useAuthStore(s => s.removeUser)
  const pending = users.filter(
    u => u.role === 'student' && !u.isValidatedByAdmin
  )

  return (
    <div>
      <PageHeader
        title="Validations"
        subtitle="Approuvez les nouvelles inscriptions élèves."
      />
      {pending.length === 0 ? (
        <div className="p-12 rounded-3xl bg-card border border-border text-center opacity-60">
          Aucune inscription en attente.
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(
            s =>
              s.role === 'student' && (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold">{s.fullName}</p>
                    <p className="text-xs opacity-60">
                      {s.email} · {s.currentClassName} · {s.province}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => upsert({ ...s, isValidatedByAdmin: true })}
                      className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold flex items-center gap-1.5"
                    >
                      <Check className="size-4" /> Valider
                    </button>
                    <button
                      onClick={() => remove(s.id)}
                      className="px-4 py-2 rounded-full border border-border text-sm font-semibold flex items-center gap-1.5 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="size-4" /> Refuser
                    </button>
                  </div>
                </div>
              )
          )}
        </div>
      )}
    </div>
  )
}

export default AdminValidations
