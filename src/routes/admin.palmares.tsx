import { PageHeader } from '@/components/dashboard-shell'
import { useSchoolStore } from '@/stores/school-store'
import { Trophy } from 'lucide-react'

function AdminPalmares() {
  const honorRolls = useSchoolStore(s => s.honorRolls)
  return (
    <div>
      <PageHeader
        title="Palmarès annuels"
        subtitle="Classements officiels de fin d'année."
      />
      <div className="space-y-6">
        {honorRolls.map(h => (
          <div
            key={h.id}
            className="p-6 rounded-3xl bg-card border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-sacred-gold/20 text-sacred-gold grid place-items-center">
                <Trophy className="size-5" />
              </div>
              <div>
                <p className="font-display text-xl">
                  {h.className} — {h.year}
                </p>
              </div>
            </div>
            <ol className="space-y-2">
              {h.rankings.map(r => (
                <li
                  key={r.rank}
                  className="flex items-center justify-between p-3 rounded-xl bg-background border border-border"
                >
                  <span className="flex items-center gap-3">
                    <span className="font-display text-2xl text-sacred-red w-8">
                      {r.rank}
                    </span>
                    {r.studentName}
                  </span>
                  <span className="font-semibold">{r.percentage}%</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminPalmares
