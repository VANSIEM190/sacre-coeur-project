import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { GuestOnly } from '@sacre-coeur/auth/guards/GuestOnly'
import { RequireRole } from '@sacre-coeur/auth/guards/RequireRole'
import { NotFound } from '@sacre-coeur/ui/components/not-found'
import ParentLayout from '../layouts/ParentLayout'
import TeacherLayout from '../layouts/TeacherLayout'

const HomePage = lazy(() => import('../features/public/pages/HomePage'))
const SchoolPage = lazy(() => import('../features/public/pages/SchoolPage'))
const AuthoritiesPage = lazy(() => import('../features/public/pages/AuthoritiesPage'))
const PrivacyPage = lazy(() => import('../features/public/pages/PrivacyPage'))
const SupportPage = lazy(() => import('../features/public/pages/SupportPage'))
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'))
const RegistrationPage = lazy(() => import('../features/auth/pages/ParentRegistrationPage'))
const InvitationPage = lazy(() => import('../features/auth/pages/InvitationPage'))
const ParentDashboard = lazy(() => import('../features/dashboard/pages/ParentDashboardPage'))
const ChildrenPage = lazy(() => import('../features/children/pages/ChildrenPage'))
const ParentAnnouncements = lazy(() => import('../features/announcements/pages/ParentAnnouncementsPage'))
const ParentCourses = lazy(() => import('../features/courses/pages/ParentCoursesPage'))
const ParentSchedules = lazy(() => import('../features/schedules/pages/ParentSchedulesPage'))
const TeacherDashboard = lazy(() => import('../features/dashboard/pages/TeacherDashboardPage'))
const TeacherClasses = lazy(() => import('../features/classes/pages/TeacherClassesPage'))
const TeacherGrades = lazy(() => import('../features/grades/pages/TeacherGradesPage'))
const TeacherSchedules = lazy(() => import('../features/schedules/pages/TeacherSchedulesPage'))
const ProfileSettings = lazy(() => import('@sacre-coeur/school-features/profile/UserProfileSettings'))

export default function App() {
  return <Suspense fallback={<div className="min-h-screen grid place-items-center bg-background text-sm opacity-60">Chargement…</div>}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/ecole" element={<SchoolPage />} />
      <Route path="/autorites" element={<AuthoritiesPage />} />
      <Route path="/confidentialite" element={<PrivacyPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/inscription" element={<RegistrationPage />} />
      <Route path="/auth/invitation" element={<InvitationPage />} />
      <Route element={<GuestOnly homeByRole={{parent:'/parent',teacher:'/teacher'}} />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<RequireRole role="parent" />}>
        <Route path="/parent" element={<ParentLayout />}>
          <Route index element={<ParentDashboard />} />
          <Route path="annonces" element={<ParentAnnouncements />} />
          <Route path="cours" element={<ParentCourses />} />
          <Route path="horaires" element={<ParentSchedules />} />
          <Route path="mesEnfants" element={<ChildrenPage />} />
          <Route path="profile" element={<ProfileSettings />} />
        </Route>
      </Route>
      <Route element={<RequireRole role="teacher" />}>
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="classes" element={<TeacherClasses />} />
          <Route path="cotations" element={<TeacherGrades />} />
          <Route path="horaires" element={<TeacherSchedules />} />
          <Route path="profile" element={<ProfileSettings />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
}

