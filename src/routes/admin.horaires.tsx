import { PageHeader } from '@/components/dashboard-shell'
import { useSchoolStore } from '@/stores/school-store'
import { useState } from 'react'
import { ALL_CLASS_NAMES } from '@/lib/mock-seed'
import type { SchoolClassName, ScheduleEntry } from '@/lib/types'
import { Plus, Trash2 } from 'lucide-react'

const DAYS: ScheduleEntry['dayOfWeek'][] = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
]

function AdminHoraires() {
  const schedule = useSchoolStore(s => s.schedule)
  const create = useSchoolStore(s => s.createScheduleEntry)
  const remove = useSchoolStore(s => s.deleteScheduleEntry)
  const [form, setForm] = useState({
    className: '4ème Secondaire' as SchoolClassName,
    dayOfWeek: 'Lundi' as ScheduleEntry['dayOfWeek'],
    startTime: '08:00',
    endTime: '09:30',
    subject: '',
    room: '',
  })

  return (
    <div>
      <PageHeader
        title="Horaires"
        subtitle="Définissez les emplois du temps par classe."
      />
      <form
        onSubmit={e => {
          e.preventDefault()
          create(form)
          setForm({ ...form, subject: '', room: '' })
        }}
        className="p-6 rounded-3xl bg-card border border-border mb-8 grid sm:grid-cols-3 gap-3"
      >
        <select
          value={form.className}
          onChange={e =>
            setForm({ ...form, className: e.target.value as SchoolClassName })
          }
          className="px-4 py-3 rounded-xl border border-border bg-background"
        >
          {ALL_CLASS_NAMES.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={form.dayOfWeek}
          onChange={e =>
            setForm({
              ...form,
              dayOfWeek: e.target.value as ScheduleEntry['dayOfWeek'],
            })
          }
          className="px-4 py-3 rounded-xl border border-border bg-background"
        >
          {DAYS.map(d => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <input
          required
          placeholder="Matière"
          value={form.subject}
          onChange={e => setForm({ ...form, subject: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background"
        />
        <input
          type="time"
          value={form.startTime}
          onChange={e => setForm({ ...form, startTime: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background"
        />
        <input
          type="time"
          value={form.endTime}
          onChange={e => setForm({ ...form, endTime: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background"
        />
        <input
          required
          placeholder="Local"
          value={form.room}
          onChange={e => setForm({ ...form, room: e.target.value })}
          className="px-4 py-3 rounded-xl border border-border bg-background"
        />
        <button className="sm:col-span-3 px-5 py-2.5 rounded-full bg-sacred-red text-white font-semibold flex items-center justify-center gap-2">
          <Plus className="size-4" /> Ajouter
        </button>
      </form>

      <div className="space-y-3">
        {schedule.map(s => (
          <div
            key={s.id}
            className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="font-display text-sm">{s.dayOfWeek}</p>
                <p className="text-xs opacity-60">
                  {s.startTime}-{s.endTime}
                </p>
              </div>
              <div>
                <p className="font-semibold">{s.subject}</p>
                <p className="text-xs opacity-60">
                  {s.className} · {s.room}
                </p>
              </div>
            </div>
            <button
              onClick={() => remove(s.id)}
              className="size-9 rounded-full border border-border grid place-items-center hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminHoraires
