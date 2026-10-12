import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@sacre-coeur/ui/layouts/dashboard-shell'
import { DashboardStats } from '../components/DashboardStats'
import { DashboardCharts } from '../components/DashboardCharts'
import { DashboardActivity } from '../components/DashboardActivity'
import { useDashboardMetrics } from '../hooks/useDashboardMetrics'

function AdminHome() {
  const navigate = useNavigate()
  const data = useDashboardMetrics()

  if (data.isLoading) return <div className="grid min-h-[50vh] place-items-center p-4 text-center sm:min-h-[60vh]"><div className="space-y-3"><Loader2 className="mx-auto size-8 animate-spin text-sacred-red sm:size-10" /><p className="text-xs font-medium opacity-60 sm:text-sm">Analyse et chargement des graphiques sécurisés...</p></div></div>
  if (data.hasError) return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/20 sm:rounded-3xl sm:p-6 sm:text-sm">Une erreur de synchronisation est survenue avec la base de données.</div>

  return <div className="animate-fade-in max-w-full space-y-6 overflow-hidden sm:space-y-8">
    <PageHeader title="Tableau de bord décisionnel" subtitle="Analyses et statistiques en temps réel du Complexe Scolaire Sacré-Cœur de Jésus." />
    <DashboardStats students={data.validatedStudents.length} teachers={data.teachers.length} classes={data.classes.length} announcements={data.announcements.length} />
    <DashboardCharts classDistribution={data.classDistribution} statusDistribution={data.statusDistribution} actorCount={data.students.length + data.teachers.length} />
    <DashboardActivity announcements={data.announcements} pendingStudents={data.pendingStudents.length} onValidate={() => navigate('/admin/validations')} />
  </div>
}

export default AdminHome
