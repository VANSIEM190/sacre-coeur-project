import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { GuestOnly } from '@sacre-coeur/auth/guards/GuestOnly'
import { RequireRole } from '@sacre-coeur/auth/guards/RequireRole'
import { NotFound } from '@sacre-coeur/ui/components/not-found'
import AdminLayout from '../layouts/AdminLayout'

const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'))
const Dashboard = lazy(() => import('../features/dashboard/pages/AdminDashboardPage'))
const Announcements = lazy(() => import('../features/announcements/pages/AnnouncementsPage'))
const Archives = lazy(() => import('../features/archives/pages/ArchivesPage'))
const Classes = lazy(() => import('../features/classes/pages/ClassesPage'))
const Courses = lazy(() => import('../features/courses/pages/CoursesPage'))
const Teachers = lazy(() => import('../features/teachers/pages/TeachersPage'))
const Schedules = lazy(() => import('../features/schedules/pages/SchedulesPage'))
const Payments = lazy(() => import('../features/finance/pages/PaymentsPage'))
const ClassFees = lazy(() => import('../features/finance/pages/ClassFeesPage'))
const HonorRoll = lazy(() => import('../features/reports/pages/HonorRollPage'))
const Validations = lazy(() => import('../features/enrollments/pages/EnrollmentValidationPage'))
const Settings = lazy(() => import('../features/settings/pages/SettingsPage'))
const Profile = lazy(() => import('@sacre-coeur/school-features/profile/UserProfileSettings'))

export default function App() {
  return <Suspense fallback={<div className="min-h-screen grid place-items-center bg-background text-sm opacity-60">Chargement…</div>}>
    <Routes>
      <Route element={<GuestOnly homeByRole={{admin:'/'}} />}><Route path="/login" element={<LoginPage />} /></Route>
      <Route element={<RequireRole role="admin" />}>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="annonces" element={<Announcements />} />
          <Route path="archives" element={<Archives />} />
          <Route path="classes" element={<Classes />} />
          <Route path="cours" element={<Courses />} />
          <Route path="enseignants" element={<Teachers />} />
          <Route path="horaires" element={<Schedules />} />
          <Route path="paiements" element={<Payments />} />
          <Route path="mode-de-paiement" element={<ClassFees />} />
          <Route path="palmares" element={<HonorRoll />} />
          <Route path="validations" element={<Validations />} />
          <Route path="parametre" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
}

