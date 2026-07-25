import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'

// Assets
import sceanceGym from '@/assets/sceancegym.jpeg'
import igfImage from '@/assets/igfImg.jpg'
import studentsGroup from '@/assets/vrais-eleves.jpg'
import schoolOffice from '@/assets/vrai-bureau.jpg'

// Types
export type Category =
  | 'all'
  | 'classe'
  | 'eleves'
  | 'administration'
  | 'sortie'
  | 'stage'
  | 'deliberation'
  | 'culture'

export interface GalleryItem {
  id: string | number
  src: string
  videoSrc?: string
  title: string
  text?: string
  category: Category
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    src: '/diplome.jpeg',
    title: 'Jury et délibération',
    text: 'Rigueur et équité lors de l’évaluation finale des résultats scolaires.',
    category: 'deliberation',
  },
  {
    id: 2,
    src: igfImage,
    videoSrc: '/videoSortieIGF.mp4',
    title: 'Pédagogie active en classe',
    text: 'Découvrez en images et en mouvement nos méthodes d’enseignement interactives.',
    category: 'classe',
  },
  {
    id: 3,
    src: sceanceGym,
    title: 'La vie des élèves',
    text: 'Un environnement sécurisé et stimulant.',
    category: 'eleves',
  },
  {
    id: 4,
    src: '/diplome.jpeg',
    title: 'Félicitations à la promotion 2024-2025',
    text: "Retour en images sur un moment fort : le couronnement de plusieurs années d'efforts, de passion et de détermination. Nous sommes fiers de célébrer la réussite de nos nouveaux diplômés alors qu'ils s'apprêtent à relever de nouveaux défis professionnels.",
    category: 'deliberation',
  },
  {
    id: 5,
    src: '/diplome2.jpeg',
    title: 'Jour 1 : Retour sur le lancement des épreuves (2025)',
    text: "Stress, concentration et ambition étaient au rendez-vous. Nos candidats avaient affronté les premières épreuves de l'Examen d'État avec sérénité et détermination. Un moment fort qui a marqué le début de leur réussite.",
    category: 'deliberation',
  },
  {
    id: 6,
    src: '/diplome3.jpeg',
    title: 'Jour 4 : Libérés et accomplis',
    text: "Clap de fin pour l'Examen d'État 2025 ! Après quatre jours d'effort intense et de concentration, l'émotion et la joie se lisaient sur tous les visages à la sortie de la dernière épreuve. Une grande étape franchie avec fierté.",
    category: 'eleves',
  },
  {
    id: 7,
    src: '/sortieIGF.jpeg',
    title: "Sortie pédagogique à l'IGF",
    text: "Nos élèves en pleine immersion à l'Inspection Générale des Finances pour lier la théorie de la classe à la réalité des institutions.",
    category: 'sortie',
  },
  {
    id: 8,
    src: '/photoIGF.jpeg',
    title: "Sortie pédagogique à l'IGF",
    text: "Nos élèves en pleine immersion à l'Inspection Générale des Finances pour lier la théorie de la classe à la réalité des institutions.",
    category: 'sortie',
  },
  {
    id: 9,
    src: '/sortie2.jpeg',
    title: "Sortie pédagogique à l'IGF",
    text: "Nos élèves en pleine immersion à l'Inspection Générale des Finances pour lier la théorie de la classe à la réalité des institutions.",
    category: 'sortie',
  },
  {
    id: 8,
    src: igfImage,
    videoSrc: '/interview2.mp4',
    title: "Sortie pédagogique à l'IGF",
    text: "Nos élèves en pleine immersion à l'Inspection Générale des Finances pour lier la théorie de la classe à la réalité des institutions.",
    category: 'sortie',
  },
  {
    id: 8,
    src: '/photoIGF.jpeg',
    title: "Sortie pédagogique à l'IGF",
    text: "Nos élèves en pleine immersion à l'Inspection Générale des Finances pour lier la théorie de la classe à la réalité des institutions.",
    category: 'sortie',
  },
  {
    id: 8,
    src: '/photoIGF.jpeg',
    title: "Sortie pédagogique à l'IGF",
    text: "Nos élèves en pleine immersion à l'Inspection Générale des Finances pour lier la théorie de la classe à la réalité des institutions.",
    category: 'sortie',
  },
  {
    id: 8,
    src: '/photoIGF.jpeg',
    title: "Sortie pédagogique à l'IGF",
    text: "Nos élèves en pleine immersion à l'Inspection Générale des Finances pour lier la théorie de la classe à la réalité des institutions.",
    category: 'sortie',
  },
  {
    id: 8,
    src: '/photoIGF.jpeg',
    title: "Sortie pédagogique à l'IGF",
    text: "Nos élèves en pleine immersion à l'Inspection Générale des Finances pour lier la théorie de la classe à la réalité des institutions.",
    category: 'sortie',
  },
  {
    id: 8,
    src: '/emphie2.jpeg',
    title: "Sortie pédagogique à l'IGF",
    text: "Nos élèves en pleine immersion à l'Inspection Générale des Finances pour lier la théorie de la classe à la réalité des institutions.",
    category: 'sortie',
  },
  {
    id: 8,
    src: '/emphie.jpeg',
    title: "Sortie pédagogique à l'IGF",
    text: "Nos élèves en pleine immersion à l'Inspection Générale des Finances pour lier la théorie de la classe à la réalité des institutions.",
    category: 'sortie',
  },
]

const FILTER_BUTTONS: { label: string; value: Category }[] = [
  { label: 'Tout voir', value: 'all' },
  { label: 'Enseignement', value: 'classe' },
  { label: 'Vie Élève', value: 'eleves' },
  { label: 'Administration', value: 'administration' },
  { label: 'Sorties & Visites', value: 'sortie' },
  { label: 'Stages', value: 'stage' },
  { label: 'Délibérations', value: 'deliberation' },
  { label: 'Journée Culturelle', value: 'culture' },
]

const ITEMS_PER_PAGE = 12

export default function EcolePage() {
  const [activeFilter, setActiveFilter] = useState<Category>('all')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)

  // État spécifiquement pour le Plein Écran du Bâtiment
  const [isBuildingFullscreen, setIsBuildingFullscreen] = useState(false)

  useEffect(() => {
    document.title = 'Sacré Cœur de Jésus - Notre École'
  }, [])

  // Fermer le plein écran avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsBuildingFullscreen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleFilterChange = (category: Category) => {
    setActiveFilter(category)
    setCurrentPage(1)
  }

  const filteredItems = useMemo(() => {
    return GALLERY_ITEMS.filter(
      item => activeFilter === 'all' || item.category === activeFilter
    )
  }, [activeFilter])

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredItems.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredItems, currentPage])

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <PublicHeader />

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sacred-red font-bold text-xs uppercase tracking-widest mb-4 block">
              Galerie & Présentation
            </span>
            <h1 className="font-display text-4xl md:text-6xl leading-tight mb-6 max-w-3xl">
              Une école, une{' '}
              <span className="italic text-sacred-red">communauté</span>, une
              mission.
            </h1>

            {/* CARTE DÉDIÉE AU BÂTIMENT DE L'ÉCOLE */}
            <div
              onClick={() => setIsBuildingFullscreen(true)}
              className="group relative my-8 rounded-2xl border border-border/50 overflow-hidden shadow-md cursor-pointer bg-black"
            >
              {/* Image de fond */}
              <img
                src="/batiment-ecole.jpeg"
                alt="Bâtiment Sacré Cœur de Jésus"
                className="w-full h-[380px] sm:h-[450px] object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Badge discret en haut à droite */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-medium border border-white/20 shadow-sm z-10">
                🔍 Clic pour plein écran
              </div>

              {/* Overlay sombre au survol pour améliorer la lisibilité du texte */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Bloc de texte + bouton qui apparaît au survol */}
              <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
                <div>
                  <h2 className="font-display font-semibold text-xl text-white">
                    Notre Établissement — Sacré Cœur de Jésus
                  </h2>
                  <p className="text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                    Découvrez le cadre d'apprentissage moderne et accueillant
                    dans lequel nos élèves évoluent au quotidien.
                  </p>
                </div>

                <button
                  onClick={e => {
                    e.stopPropagation()
                    setIsBuildingFullscreen(true)
                  }}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-sacred-red text-white text-xs font-medium hover:bg-sacred-red/90 transition-colors shadow-lg self-start sm:self-auto"
                >
                  Agrandir l'image
                </button>
              </div>
            </div>

            <p className="text-base md:text-lg opacity-70 max-w-2xl leading-relaxed">
              Explorez la vie au quotidien du Sacré Cœur de Jésus à travers
              notre médiathèque.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section Galerie (Comportement original inchangé) */}
      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Barre de filtres */}
          <div className="flex flex-wrap gap-2.5 justify-center mb-12">
            {FILTER_BUTTONS.map(button => {
              const isActive = activeFilter === button.value
              return (
                <button
                  key={button.value}
                  onClick={() => handleFilterChange(button.value)}
                  className={`px-5 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-sacred-red text-white shadow-md shadow-sacred-red/20'
                      : 'bg-muted/60 hover:bg-muted text-foreground/80'
                  }`}
                >
                  {button.label}
                </button>
              )
            })}
          </div>

          {/* Grille Galerie Originale */}
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {paginatedItems.map((item, index) => {
                const hasVideo = !!item.videoSrc
                return (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    onClick={() => setSelectedItem(item)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl bg-muted/30 border border-border/40 shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-black/5 relative">
                      <img
                        src={item.src}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {hasVideo && (
                        <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-sacred-red animate-pulse" />
                          Vidéo
                        </span>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                        <h3 className="font-medium text-sm line-clamp-1">
                          {item.title}
                        </h3>
                        {item.text && (
                          <p className="text-xs text-white/70 line-clamp-2 mt-1">
                            {item.text}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2 text-sm rounded-lg border bg-background disabled:opacity-40"
              >
                Précédent
              </button>
              <span className="text-sm px-4">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage(prev => Math.min(prev + 1, totalPages))
                }
                className="px-4 py-2 text-sm rounded-lg border bg-background disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </section>

      {/* --- MODAL PLEIN ÉCRAN POUR BATIMENT-ECOLE.JPEG --- */}
      <AnimatePresence>
        {isBuildingFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsBuildingFullscreen(false)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex flex-col justify-between p-4 md:p-8 cursor-zoom-out"
          >
            {/* Entête */}
            <div className="flex justify-between items-center text-white z-10">
              <div>
                <h3 className="text-lg font-semibold">
                  Bâtiment du Sacré Cœur de Jésus
                </h3>
                <p className="text-xs text-white/70">
                  Vue d'ensemble de nos infrastructures
                </p>
              </div>
              <button
                onClick={() => setIsBuildingFullscreen(false)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full px-4 py-2 transition-colors text-xs font-medium border border-white/10"
              >
                ✕ Réduire
              </button>
            </div>

            {/* Image Plein Écran */}
            <div
              className="flex-1 flex items-center justify-center my-4 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                src="/batiment-ecole.jpeg"
                alt="Bâtiment en plein écran"
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              />
            </div>

            <div className="text-center text-xs text-white/50">
              Cliquez n'importe où autour de l'image ou appuyez sur{' '}
              <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">
                Échap
              </kbd>{' '}
              pour revenir.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL CLASSIQUE DE LA GALERIE --- */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-background max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl border border-border flex flex-col md:flex-row max-h-[90vh]"
            >
              <div className="md:w-2/3 bg-black flex items-center justify-center relative min-h-[300px]">
                {selectedItem.videoSrc ? (
                  <video
                    controls
                    autoPlay
                    className="w-full h-full max-h-[70vh] object-contain"
                  >
                    <source src={selectedItem.videoSrc} type="video/mp4" />
                  </video>
                ) : (
                  <img
                    src={selectedItem.src}
                    alt={selectedItem.title}
                    className="w-full h-full max-h-[70vh] object-contain"
                  />
                )}
              </div>

              <div className="md:w-1/3 p-6 flex flex-col justify-between bg-card">
                <div>
                  <span className="text-sacred-red font-semibold text-xs uppercase tracking-wider block mb-2">
                    {selectedItem.category}
                  </span>
                  <h2 className="text-2xl font-display font-semibold mb-3">
                    {selectedItem.title}
                  </h2>
                  <p className="text-sm opacity-80 leading-relaxed">
                    {selectedItem.text || 'Aucune description disponible.'}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedItem(null)}
                  className="mt-6 w-full py-2.5 rounded-xl bg-muted text-foreground hover:bg-muted/80 text-sm font-medium transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PublicFooter />
    </div>
  )
}
