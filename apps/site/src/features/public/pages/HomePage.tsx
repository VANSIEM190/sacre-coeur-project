import { useEffect } from 'react'
import { PublicHeader } from '@/layouts/public-header'
import { PublicFooter } from '@/layouts/public-footer'
import { useAuthStore } from '@sacre-coeur/auth/stores/auth-store'
import { HomeHero, PlatformSection, HistorySection, FaqSection, ContactSection } from '../components/HomeSections'

export default function HomePage() {
  const isAuthenticated = useAuthStore(state => !!state.currentUser)

  useEffect(() => {
    document.title = 'Sacré Cœur de Jésus — Accueil'
  }, [])

  return <div className="min-h-screen bg-background text-foreground">
    <PublicHeader />
    <HomeHero isAuthenticated={isAuthenticated} />
    <PlatformSection />
    <HistorySection />
    <FaqSection />
    <ContactSection />
    <PublicFooter />
  </div>
}
