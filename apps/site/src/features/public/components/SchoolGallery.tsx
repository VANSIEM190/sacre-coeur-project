import { AnimatePresence, motion } from 'framer-motion'
import type { Category, GalleryItem } from '../types/gallery'
import { FILTER_BUTTONS } from '../types/gallery'

interface SchoolGalleryProps {
  activeFilter: Category
  currentPage: number
  totalPages: number
  items: GalleryItem[]
  onFilterChange: (category: Category) => void
  onPageChange: (page: number) => void
  onSelect: (item: GalleryItem) => void
}

export function SchoolGallery({ activeFilter, currentPage, totalPages, items, onFilterChange, onPageChange, onSelect }: SchoolGalleryProps) {
  return <section className="px-6 pb-24"><div className="mx-auto max-w-7xl">
    <div className="mb-12 flex flex-wrap justify-center gap-2.5">{FILTER_BUTTONS.map(button => <button key={button.value} onClick={() => onFilterChange(button.value)} className={activeFilter === button.value ? 'rounded-full bg-sacred-red px-5 py-2 text-xs font-medium text-white shadow-md shadow-sacred-red/20 md:text-sm' : 'rounded-full bg-muted/60 px-5 py-2 text-xs font-medium text-foreground/80 hover:bg-muted md:text-sm'}>{button.label}</button>)}</div>
    <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <AnimatePresence mode="popLayout">{items.map((item, index) => <motion.button type="button" layout key={item.id + '-' + item.src} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3, delay: index * 0.03 }} onClick={() => onSelect(item)} className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/40 bg-muted/30 text-left shadow-sm transition-all duration-300 hover:shadow-xl">
        <div className="relative aspect-4/3 w-full overflow-hidden bg-black/5"><img src={item.src} alt={item.title} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />{item.videoSrc && <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white"><span className="size-2 animate-pulse rounded-full bg-sacred-red" />Vidéo</span>}<span className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/80 via-black/20 to-transparent p-4 text-white opacity-0 transition-opacity group-hover:opacity-100"><span className="line-clamp-1 text-sm font-medium">{item.title}</span>{item.text && <span className="mt-1 line-clamp-2 text-xs text-white/70">{item.text}</span>}</span></div>
      </motion.button>)}</AnimatePresence>
    </motion.div>
    {totalPages > 1 && <div className="mt-12 flex items-center justify-center gap-2"><button disabled={currentPage === 1} onClick={() => onPageChange(Math.max(currentPage - 1, 1))} className="rounded-lg border bg-background px-4 py-2 text-sm disabled:opacity-40">Précédent</button><span className="px-4 text-sm">Page {currentPage} sur {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} className="rounded-lg border bg-background px-4 py-2 text-sm disabled:opacity-40">Suivant</button></div>}
  </div></section>
}

export function SchoolIntro({ onBuildingOpen }: { onBuildingOpen: () => void }) {
  return <section className="px-6 py-16"><div className="mx-auto max-w-6xl"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
    <span className="mb-4 block text-xs font-bold uppercase tracking-widest text-sacred-red">Galerie & Présentation</span><h1 className="mb-6 max-w-3xl font-display text-4xl leading-tight md:text-6xl">Une école, une <span className="italic text-sacred-red">communauté</span>, une mission.</h1>
    <button type="button" onClick={onBuildingOpen} className="group relative my-8 block w-full cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-black text-left shadow-md">
      <img src="/batiment-ecole.jpeg" alt="Bâtiment Sacré Cœur de Jésus" className="h-95 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-112.5" /><span className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-xs font-medium text-white">🔍 Clic pour plein écran</span><span className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" /><span className="absolute bottom-0 left-0 right-0 flex translate-y-3 flex-col justify-between gap-4 p-6 text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 sm:flex-row sm:items-end"><span><span className="block font-display text-xl font-semibold">Notre Établissement — Sacré Cœur de Jésus</span><span className="mt-1 block max-w-2xl text-sm text-white/80">Découvrez le cadre d'apprentissage moderne et accueillant de nos élèves.</span></span><span className="shrink-0 rounded-xl bg-sacred-red px-4 py-2.5 text-xs font-medium text-white">Agrandir l'image</span></span>
    </button><p className="max-w-2xl text-base leading-relaxed opacity-70 md:text-lg">Explorez la vie au quotidien du Sacré Cœur de Jésus à travers notre médiathèque.</p>
  </motion.div></div></section>
}
