import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'

// Assets - Images
import schoolBuilding from '@/assets/vrai-batiment.jpg'
import sceanceGym from '@/assets/sceancegym.jpeg'
import igfImage from '@/assets/igfImg.jpg'
import studentsGroup from '@/assets/vrais-eleves.jpg'
import schoolOffice from '@/assets/vrai-bureau.jpg'

// Assets - Vidéo (Importe ta vidéo ici ou utilise une URL directe)
import classeVideo from '@/assets/videoSortieIGF.mp4'

// Définition des types
type Category = 'all' | 'classe' | 'eleves' | 'administration'

interface GalleryItem {
  src: string // Sert d'image de couverture s'il y a une vidéo
  videoSrc?: string // Chemin ou URL optionnelle de la vidéo
  title: string
  text: string
  category: Category
}

// Ajout de la vidéo dans le filtrage (ici associée à la catégorie "classe")
const GALLERY_ITEMS: GalleryItem[] = [
  {
    src: igfImage,
    videoSrc: classeVideo, // La vidéo est maintenant liée à cet élément du filtre
    title: 'Pédagogie active en classe',
    text: 'Découvrez en images et en mouvement nos méthodes d’enseignement interactives et bienveillantes au quotidien.',
    category: 'classe',
  },
  {
    src: sceanceGym,
    title: 'La vie des élèves',
    text: "Un environnement sécurisé et stimulant qui favorise l'épanouissement individuel et collectif.",
    category: 'eleves',
  },
  {
    src: schoolOffice,
    title: 'Les bureaux administratifs',
    text: 'Une équipe engagée et toujours disponible pour accompagner au mieux chaque famille.',
    category: 'administration',
  },
]

const FILTER_BUTTONS = [
  { label: 'Tout voir', value: 'all' as Category },
  { label: 'Enseignement', value: 'classe' as Category },
  { label: 'Vie Élève', value: 'eleves' as Category },
  { label: 'Administration', value: 'administration' as Category },
]

export default function EcolePage() {
  const [activeFilter, setActiveFilter] = useState<Category>('all')
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(
    null
  )
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({})

  useEffect(() => {
    document.title = 'Sacré Cœur de Jésus - Notre École'
  }, [])

  // Gérer la lecture d'une vidéo spécifique dans le filtrage
  const handlePlayVideo = (index: number) => {
    setPlayingVideoIndex(index)
    setTimeout(() => {
      const videoElement = videoRefs.current[index]
      if (videoElement) {
        videoElement.play()
      }
    }, 150)
  }

  // Filtrage des éléments
  const filteredItems = GALLERY_ITEMS.filter(
    item => activeFilter === 'all' || item.category === activeFilter
  )

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <PublicHeader />

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sacred-red font-bold text-xs uppercase tracking-widest mb-4 block">
              Présentation
            </span>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mb-8 max-w-3xl">
              Une école, une{' '}
              <span className="italic text-sacred-red">communauté</span>, une
              mission.
            </h1>
            <p className="text-lg opacity-70 max-w-2xl leading-relaxed">
              Pénétrez dans nos murs et découvrez l'âme du Sacré Cœur de Jésus :
              nos bâtiments, nos enseignants passionnés, nos élèves engagés et
              notre administration dévouée.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-16 rounded-[2rem] overflow-hidden aspect-[21/9] shadow-2xl"
          >
            <img
              src={schoolBuilding}
              alt="Vue principale du campus"
              className="w-full h-full object-cover select-none"
              width={1280}
              height={548}
            />
          </motion.div>
        </div>
      </section>

      {/* Galerie / Section Filtrée */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Boutons de Filtrage */}
          <div className="flex flex-wrap gap-3 justify-center mb-16">
            {FILTER_BUTTONS.map(button => {
              const isActive = activeFilter === button.value
              return (
                <button
                  key={button.value}
                  onClick={() => {
                    setActiveFilter(button.value)
                    setPlayingVideoIndex(null) // Réinitialise l'état de lecture lors du changement de filtre
                  }}
                  className={`relative px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-sacred-red text-white shadow-lg shadow-sacred-red/10'
                      : 'bg-muted/50 hover:bg-muted text-foreground/80'
                  }`}
                >
                  {button.label}
                </button>
              )
            })}
          </div>

          {/* Liste dynamique */}
          <div className="grid gap-24 min-h-[400px]">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, i) => {
                const isEven = i % 2 === 1
                const hasVideo = !!item.videoSrc
                const isVideoPlaying = playingVideoIndex === i

                return (
                  <motion.div
                    layout
                    key={item.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      type: 'spring',
                      stiffness: 100,
                    }}
                    className="grid md:grid-cols-2 gap-12 items-center"
                  >
                    {/* Conteneur Média (Image OU Vidéo) */}
                    <div
                      className={`aspect-[4/3] rounded-3xl overflow-hidden shadow-xl bg-black relative group ${isEven ? 'md:order-2' : ''}`}
                    >
                      {hasVideo ? (
                        <AnimatePresence initial={false}>
                          {!isVideoPlaying ? (
                            /* Miniature + Bouton Play pour l'élément vidéo */
                            <motion.div
                              key="video-cover"
                              initial={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              onClick={() => handlePlayVideo(i)}
                              className="absolute inset-0 w-full h-full cursor-pointer z-10"
                            >
                              <img
                                src={item.src}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 opacity-80"
                                loading="lazy"
                              />
                              {/* Badge Indicateur "Vidéo" discret pour le différencier d'une image simple */}
                              <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                                Vidéo
                              </span>
                              {/* Bouton Play au centre */}
                              <div className="absolute inset-0 grid place-items-center">
                                <div className="size-16 rounded-full bg-sacred-red grid place-items-center transition-all duration-300 group-hover:scale-110 shadow-lg shadow-sacred-red/20">
                                  <div className="size-0 border-y-[10px] border-y-transparent border-l-[15px] border-l-white ml-1" />
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            /* Lecteur vidéo intégré */
                            <motion.div
                              key="video-player"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="w-full h-full"
                            >
                              <video
                                ref={el => {
                                  videoRefs.current[i] = el
                                }}
                                className="w-full h-full object-cover"
                                controls
                                playsInline
                              >
                                <source src={item.videoSrc} type="video/mp4" />
                                Votre navigateur ne prend pas en charge la
                                lecture de cette vidéo.
                              </video>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      ) : (
                        /* Image classique (sans vidéo associée) */
                        <img
                          src={item.src}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          loading="lazy"
                          width={800}
                          height={600}
                        />
                      )}
                    </div>

                    {/* Conteneur Texte */}
                    <div className={isEven ? 'md:order-1' : ''}>
                      <span className="font-display italic text-sacred-red text-5xl block mb-4 select-none">
                        0{i + 1}
                      </span>
                      <h2 className="font-display text-4xl mb-4">
                        {item.title}
                      </h2>
                      <p className="opacity-70 leading-relaxed">{item.text}</p>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
