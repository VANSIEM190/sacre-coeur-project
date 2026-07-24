import { useMemo } from 'react'
import {
  Users,
  GraduationCap,
  Megaphone,
  BookOpen,
  Calendar,
  ChevronRight,
  Loader2,
  TrendingUp,
  PieChart as PieIcon,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/Dashboard-shell'
import { useFetchData } from '@/hooks/useQuery'
import { studentService } from '@/services/student/Student.service'
import { classService } from '@/services/classe/classe.service'
import { announcementService } from '@/services/announcement/announcement.service'
import { useAuthStore } from '@/stores/auth-store'
import type { EleveDetails, ClassName, Announcement } from '@/lib/types'

function AdminHome() {
  const navigate = useNavigate()

  // 1. Récupération des données réelles de la DB
  const {
    data: allStudents = [],
    isLoading: isLoadingStudents,
    error: studentError,
  } = useFetchData<EleveDetails[]>(['all-students'], () =>
    studentService.getAllStudents()
  )

  const {
    data: allClasses = [],
    isLoading: isLoadingClasses,
    error: classError,
  } = useFetchData<ClassName[]>(['all-classes'], () =>
    classService.getAllClasses()
  )

  const {
    data: announcements = [],
    isLoading: isLoadingAnnouncements,
    error: announcementError,
  } = useFetchData<Announcement[]>(['recent-announcements'], () =>
    announcementService.getAnnouncement()
  )

  // Récupération des enseignants
  const registeredUsers = useAuthStore(s => s.registeredUsers)
  const teachers = useMemo(
    () => registeredUsers.filter(u => u.role === 'teacher'),
    [registeredUsers]
  )

  // Helper : Récupération sécurisée du premier élément du tableau inscriptions
  const getInscription = (student: EleveDetails) => student.inscriptions?.[0]

  // 2. Traitement des statuts d'inscriptions
  const validatedStudents = useMemo(() => {
    return allStudents.filter(s => {
      const status = getInscription(s)?.status || s.status
      return status === 'accepte' || status === 'valide'
    })
  }, [allStudents])

  const pendingStudents = useMemo(() => {
    return allStudents.filter(s => {
      const status = getInscription(s)?.status || s.status
      return status === 'en_attente'
    })
  }, [allStudents])

  // 3. Données Bar Chart (Répartition des classes)
  const classDistributionData = useMemo(() => {
    return allClasses.map(cls => {
      const count = validatedStudents.filter(s => {
        const classeId = getInscription(s)?.classe_id || s.classe_id
        return classeId === cls.id
      }).length

      return {
        name: cls.nom_classe,
        'Élèves actifs': count,
      }
    })
  }, [allClasses, validatedStudents])

  // 4. Données Pie Chart (Aperçu Global)
  const administrativePieData = useMemo(() => {
    return [
      {
        name: 'Élèves Validés',
        value: validatedStudents.length,
        color: '#991b1b',
      },
      { name: 'En Attente', value: pendingStudents.length, color: '#f59e0b' },
      { name: 'Enseignants', value: teachers.length, color: '#3b82f6' },
    ]
  }, [validatedStudents, pendingStudents, teachers])

  const isLoading =
    isLoadingStudents || isLoadingClasses || isLoadingAnnouncements

  if (isLoading) {
    return (
      <div className="min-h-[50vh] sm:min-h-[60vh] grid place-items-center p-4 text-center">
        <div className="space-y-3">
          <Loader2 className="size-8 sm:size-10 animate-spin text-sacred-red mx-auto" />
          <p className="text-xs sm:text-sm opacity-60 font-medium">
            Analyse et chargement des graphiques sécurisés...
          </p>
        </div>
      </div>
    )
  }

  if (studentError || classError || announcementError) {
    return (
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 text-xs sm:text-sm font-medium">
        Une erreur de synchronisation est survenue avec la base de données.
      </div>
    )
  }

  const stats = [
    {
      icon: Users,
      label: 'Élèves inscrits',
      value: validatedStudents.length,
      color: 'bg-sacred-red/10 text-sacred-red',
    },
    {
      icon: GraduationCap,
      label: 'Enseignants activés',
      value: teachers.length,
      color: 'bg-sacred-gold/20 text-sacred-gold',
    },
    {
      icon: BookOpen,
      label: 'Classes actives',
      value: allClasses.length,
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      icon: Megaphone,
      label: 'Annonces actives',
      value: announcements.length,
      color: 'bg-emerald-500/10 text-emerald-600',
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-full overflow-hidden">
      <PageHeader
        title="Tableau de bord décisionnel"
        subtitle="Analyses et statistiques en temps réel du Complexe Scolaire Sacré-Cœur de Jésus."
      />

      {/* Cartes Statistiques : 1 col mobile, 2 cols tablette, 4 cols desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map(s => (
          <div
            key={s.label}
            className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center">
              <div
                className={`size-10 sm:size-12 rounded-xl sm:rounded-2xl ${s.color} grid place-items-center shrink-0`}
              >
                <s.icon className="size-5 sm:size-6" />
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Live DB
              </span>
            </div>
            <div className="mt-4">
              <p className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                {s.value}
              </p>
              <p className="text-xs sm:text-sm opacity-60 font-medium mt-0.5">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Section Graphiques : 1 col mobile/tablette, 3 cols desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Histogramme des classes */}
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border flex flex-col justify-between w-full overflow-hidden">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-4 sm:size-5 text-sacred-red" />
              <h2 className="font-display text-base sm:text-lg font-bold">
                Répartition des effectifs
              </h2>
            </div>
            <p className="text-xs opacity-60">
              Nombre exact d'élèves physiques rattachés par classe.
            </p>
          </div>

          <div className="h-64 sm:h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={classDistributionData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#991b1b" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#991b1b" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.15}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'currentColor', opacity: 0.7, fontSize: 10 }}
                  interval={0} // Affiche toutes les classes sans en sauter
                  angle={-45} // Incline le texte
                  textAnchor="end" // Aligne la fin du texte sur la graduation
                  height={70} // Donne de l'espace en bas pour ne pas masquer le texte
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 10 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(153, 27, 27, 0.05)' }}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="Élèves actifs"
                  fill="url(#barColor)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border flex flex-col justify-between w-full">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <PieIcon className="size-4 sm:size-5 text-sacred-gold" />
              <h2 className="font-display text-base sm:text-lg font-bold">
                Statuts & Comptes
              </h2>
            </div>
            <p className="text-xs opacity-60">
              Équilibre global des acteurs de l'établissement.
            </p>
          </div>

          <div className="h-56 sm:h-64 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={administrativePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {administrativePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute text-center pointer-events-none">
              <span className="text-xl sm:text-2xl font-bold font-display">
                {allStudents.length + teachers.length}
              </span>
              <p className="text-[9px] sm:text-[10px] uppercase opacity-50 tracking-wider">
                Acteurs
              </p>
            </div>
          </div>

          <div className="space-y-2 mt-2 sm:mt-4">
            {administrativePieData.map(item => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="opacity-70 font-medium truncate max-w-30 sm:max-w-none">
                    {item.name}
                  </span>
                </div>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section Annonces & Action Inscriptions : 1 col mobile, 2 cols desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Annonces */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg sm:text-xl font-bold">
                Dernières annonces
              </h2>
              <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium flex items-center gap-1">
                <Calendar className="size-3" /> Récentes
              </span>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {announcements.length === 0 ? (
                <p className="text-xs sm:text-sm opacity-50 text-center py-6">
                  Aucune annonce publiée.
                </p>
              ) : (
                announcements.slice(0, 3).map(a => (
                  <div
                    key={a.id}
                    className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/40 border border-border/50"
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className="font-semibold text-xs sm:text-sm line-clamp-1">
                        {a.title}
                      </p>
                      <span className="text-[9px] sm:text-[10px] opacity-50 font-mono shrink-0">
                        {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-xs opacity-70 line-clamp-2 leading-relaxed">
                      {a.body}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CTA Inscriptions */}
        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-sacred-red text-white flex flex-col justify-between relative overflow-hidden group min-h-55">
          <div className="absolute -right-10 -bottom-10 size-32 sm:size-40 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500 pointer-events-none" />

          <div className="relative z-10">
            <h2 className="font-display text-lg sm:text-xl font-bold mb-2 sm:mb-4">
              Inscriptions en attente
            </h2>
            <p className="font-display text-4xl sm:text-6xl font-black tracking-tight mb-2">
              {pendingStudents.length}
            </p>
            <p className="opacity-90 text-xs sm:text-sm leading-relaxed max-w-sm">
              Dossiers d'élèves en attente de vérification administrative pour
              validation définitive.
            </p>
          </div>

          <button
            onClick={() => navigate('/admin/validations')}
            className="mt-6 w-full sm:w-auto self-start px-5 py-3 sm:py-2.5 bg-white text-sacred-red font-semibold text-xs sm:text-sm rounded-xl sm:rounded-2xl hover:bg-white/90 active:scale-95 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 cursor-pointer relative z-10"
          >
            Valider les dossiers
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminHome
