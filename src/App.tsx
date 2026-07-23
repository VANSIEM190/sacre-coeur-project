import { Routes, Route, Link } from 'react-router-dom'
import { useThemeEffect } from '@/hooks/use-theme-effect'

import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'

import HomePage from './routes/index'
import LoginPage from './routes/login'
import InscriptionParentPage from './routes/parentInscription'
import EcolePage from './routes/ecole'
import AutoritesPage from './routes/autorites'
import ConfidentialitePage from './routes/confidentialite'
import SupportPage from './routes/support'

import AdminLayout from './routes/admin'
import AdminHome from './routes/admin.index'
import AdminAnnonces from './routes/admin.annonces'
import AdminArchives from './routes/admin.archives'
import AdminClasses from './routes/admin.classes'
import AdminCours from './routes/admin.cours'
import AdminTeachers from './routes/admin.enseignants'
import AdminHoraires from './routes/admin.horaires'
import AdminPaiements from './routes/admin.paiements'
import AdminPalmares from './routes/admin.palmares'
import AdminValidations from './routes/admin.validations'

import ParentLayout from './routes/parent'
import ParentHome from './routes/parent.index'
import ParentAnnonces from './routes/parent.annonces'
import ParentCours from './routes/parent.cours'
import ParentHoraires from './routes/parent.horaires'

import TeacherLayout from './routes/teacher'
import TeacherHome from './routes/teacher.index'
import TeacherClasses from './routes/teacher.classes'
import TeacherCotations from './routes/teacher.cotations'
import TeacherHoraires from './routes/teacher.horaires'
import { supabase } from './supabase/supabaseClient'
import { Toaster } from 'sonner'
import ParentChildrenManager from './routes/parentChildrenManager'
import AdminFixationPaiement from './routes/admin.fixatiionPaiement'
import AdminSettings from './routes/admin.settings'

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page introuvable
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}

export function GuestRoute() {
  const currentUser = useAuthStore(s => s.currentUser)

  if (currentUser) {
    // Redirige vers le dashboard selon son rôle ou une page par défaut
    return <Navigate to={`/${currentUser?.role}`} replace />
  }

  return <Outlet />
}

export default function App() {
  useThemeEffect()
  console.log(supabase)
  return (
    <>
      <Toaster position="bottom-right" />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ecole" element={<EcolePage />} />
        <Route path="/autorites" element={<AutoritesPage />} />
        <Route path="/confidentialite" element={<ConfidentialitePage />} />
        <Route path="/support" element={<SupportPage />} />

        <Route element={<GuestRoute />}>
          <Route path="/inscription" element={<InscriptionParentPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="annonces" element={<AdminAnnonces />} />
          <Route path="archives" element={<AdminArchives />} />
          <Route path="classes" element={<AdminClasses />} />
          <Route path="cours" element={<AdminCours />} />
          <Route path="enseignants" element={<AdminTeachers />} />
          <Route path="horaires" element={<AdminHoraires />} />
          <Route path="paiements" element={<AdminPaiements />} />
          <Route path="mode-de-paiement" element={<AdminFixationPaiement />} />
          <Route path="palmares" element={<AdminPalmares />} />
          <Route path="validations" element={<AdminValidations />} />
          <Route path="parametre" element={<AdminSettings />} />
        </Route>

        <Route path="/parent" element={<ParentLayout />}>
          <Route index element={<ParentHome />} />
          <Route path="annonces" element={<ParentAnnonces />} />
          <Route path="cours" element={<ParentCours />} />
          <Route path="horaires" element={<ParentHoraires />} />
          <Route path="mesEnfants" element={<ParentChildrenManager />} />
        </Route>

        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<TeacherHome />} />
          <Route path="classes" element={<TeacherClasses />} />
          <Route path="cotations" element={<TeacherCotations />} />
          <Route path="horaires" element={<TeacherHoraires />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
