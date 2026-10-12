import { useSchoolGallery } from '../hooks/useSchoolGallery'
import { PublicHeader } from '@/layouts/public-header'
import { PublicFooter } from '@/layouts/public-footer'
import sceanceGym from '@/assets/sceancegym.jpeg'
import igfImage from '@/assets/igfImg.jpg'
import type { GalleryItem } from '../types/gallery'
import { SchoolGallery, SchoolIntro } from '../components/SchoolGallery'
import { SchoolGalleryDialogs } from '../components/SchoolGalleryDialogs'


const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    src: '/diplome.jpeg',
    title: 'Jury et dÃ©libÃ©ration',
    text: 'Rigueur et Ã©quitÃ© lors de lâ€™Ã©valuation finale des rÃ©sultats scolaires.',
    category: 'deliberation',
  },
  {
    id: 2,
    src: igfImage,
    videoSrc: '/videoSortieIGF.mp4',
    title: 'PÃ©dagogie active en classe',
    text: 'DÃ©couvrez en images et en mouvement nos mÃ©thodes dâ€™enseignement interactives.',
    category: 'classe',
  },
  {
    id: 3,
    src: sceanceGym,
    title: 'La vie des Ã©lÃ¨ves',
    text: 'Un environnement sÃ©curisÃ© et stimulant.',
    category: 'eleves',
  },
  {
    id: 4,
    src: '/diplome.jpeg',
    title: 'FÃ©licitations Ã  la promotion 2024-2025',
    text: "Retour en images sur un moment fort : le couronnement de plusieurs annÃ©es d'efforts, de passion et de dÃ©termination. Nous sommes fiers de cÃ©lÃ©brer la rÃ©ussite de nos nouveaux diplÃ´mÃ©s alors qu'ils s'apprÃªtent Ã  relever de nouveaux dÃ©fis professionnels.",
    category: 'deliberation',
  },
  {
    id: 5,
    src: '/diplome2.jpeg',
    title: 'Jour 1 : Retour sur le lancement des Ã©preuves (2025)',
    text: "Stress, concentration et ambition Ã©taient au rendez-vous. Nos candidats avaient affrontÃ© les premiÃ¨res Ã©preuves de l'Examen d'Ã‰tat avec sÃ©rÃ©nitÃ© et dÃ©termination. Un moment fort qui a marquÃ© le dÃ©but de leur rÃ©ussite.",
    category: 'deliberation',
  },
  {
    id: 6,
    src: '/diplome3.jpeg',
    title: 'Jour 4 : LibÃ©rÃ©s et accomplis',
    text: "Clap de fin pour l'Examen d'Ã‰tat 2025 ! AprÃ¨s quatre jours d'effort intense et de concentration, l'Ã©motion et la joie se lisaient sur tous les visages Ã  la sortie de la derniÃ¨re Ã©preuve. Une grande Ã©tape franchie avec fiertÃ©.",
    category: 'eleves',
  },
  {
    id: 7,
    src: '/sortieIGF.jpeg',
    title: "Sortie pÃ©dagogique Ã  l'IGF",
    text: "Nos Ã©lÃ¨ves en pleine immersion Ã  l'Inspection GÃ©nÃ©rale des Finances pour lier la thÃ©orie de la classe Ã  la rÃ©alitÃ© des institutions.",
    category: 'sortie',
  },
  {
    id: 8,
    src: '/photoIGF.jpeg',
    title: "Sortie pÃ©dagogique Ã  l'IGF",
    text: "Nos Ã©lÃ¨ves en pleine immersion Ã  l'Inspection GÃ©nÃ©rale des Finances pour lier la thÃ©orie de la classe Ã  la rÃ©alitÃ© des institutions.",
    category: 'sortie',
  },
  {
    id: 9,
    src: '/sortie2.jpeg',
    title: "Sortie pÃ©dagogique Ã  l'IGF",
    text: "Nos Ã©lÃ¨ves en pleine immersion Ã  l'Inspection GÃ©nÃ©rale des Finances pour lier la thÃ©orie de la classe Ã  la rÃ©alitÃ© des institutions.",
    category: 'sortie',
  },
  {
    id: 8,
    src: igfImage,
    videoSrc: '/interview2.mp4',
    title: "Sortie pÃ©dagogique Ã  l'IGF",
    text: "Nos Ã©lÃ¨ves en pleine immersion Ã  l'Inspection GÃ©nÃ©rale des Finances pour lier la thÃ©orie de la classe Ã  la rÃ©alitÃ© des institutions.",
    category: 'sortie',
  },
  {
    id: 8,
    src: '/diplomeResultat.jpeg',
    title: "Sortie pÃ©dagogique Ã  l'IGF",
    text: "Nos Ã©lÃ¨ves en pleine immersion Ã  l'Inspection GÃ©nÃ©rale des Finances pour lier la thÃ©orie de la classe Ã  la rÃ©alitÃ© des institutions.",
    category: 'sortie',
  },
  {
    id: 8,
    src: '/diplomeResultat1.jpeg',
    title: "Sortie pÃ©dagogique Ã  l'IGF",
    text: "Nos Ã©lÃ¨ves en pleine immersion Ã  l'Inspection GÃ©nÃ©rale des Finances pour lier la thÃ©orie de la classe Ã  la rÃ©alitÃ© des institutions.",
    category: 'sortie',
  },
  {
    id: 8,
    src: '/photoIGF.jpeg',
    title: "Sortie pÃ©dagogique Ã  l'IGF",
    text: "Nos Ã©lÃ¨ves en pleine immersion Ã  l'Inspection GÃ©nÃ©rale des Finances pour lier la thÃ©orie de la classe Ã  la rÃ©alitÃ© des institutions.",
    category: 'sortie',
  },
  {
    id: 8,
    src: '/photoIGF.jpeg',
    title: "Sortie pÃ©dagogique Ã  l'IGF",
    text: "Nos Ã©lÃ¨ves en pleine immersion Ã  l'Inspection GÃ©nÃ©rale des Finances pour lier la thÃ©orie de la classe Ã  la rÃ©alitÃ© des institutions.",
    category: 'sortie',
  },
  {
    id: 8,
    src: '/emphie2.jpeg',
    title: "Sortie pÃ©dagogique Ã  l'IGF",
    text: "Nos Ã©lÃ¨ves en pleine immersion Ã  l'Inspection GÃ©nÃ©rale des Finances pour lier la thÃ©orie de la classe Ã  la rÃ©alitÃ© des institutions.",
    category: 'sortie',
  },
  {
    id: 8,
    src: '/emphie.jpeg',
    title: "Sortie pÃ©dagogique Ã  l'IGF",
    text: "Nos Ã©lÃ¨ves en pleine immersion Ã  l'Inspection GÃ©nÃ©rale des Finances pour lier la thÃ©orie de la classe Ã  la rÃ©alitÃ© des institutions.",
    category: 'sortie',
  },
]


export default function EcolePage() {
  const gallery = useSchoolGallery(GALLERY_ITEMS)

  return <div className="min-h-screen bg-background text-foreground antialiased">
    <PublicHeader />
    <SchoolIntro onBuildingOpen={() => gallery.setIsBuildingFullscreen(true)} />
    <SchoolGallery
      activeFilter={gallery.activeFilter}
      currentPage={gallery.currentPage}
      totalPages={gallery.totalPages}
      items={gallery.paginatedItems}
      onFilterChange={gallery.changeFilter}
      onPageChange={gallery.setCurrentPage}
      onSelect={gallery.setSelectedItem}
    />
    <SchoolGalleryDialogs
      buildingOpen={gallery.isBuildingFullscreen}
      selectedItem={gallery.selectedItem}
      onCloseBuilding={() => gallery.setIsBuildingFullscreen(false)}
      onCloseItem={() => gallery.setSelectedItem(null)}
    />
    <PublicFooter />
  </div>
}

