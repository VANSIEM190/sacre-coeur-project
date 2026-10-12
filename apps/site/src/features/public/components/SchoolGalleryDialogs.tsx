import { AnimatePresence, motion } from 'framer-motion'
import type { GalleryItem } from '../types/gallery'

interface SchoolGalleryDialogsProps {
  buildingOpen: boolean
  selectedItem: GalleryItem | null
  onCloseBuilding: () => void
  onCloseItem: () => void
}

export function SchoolGalleryDialogs({ buildingOpen, selectedItem, onCloseBuilding, onCloseItem }: SchoolGalleryDialogsProps) {
  return <>
    <AnimatePresence>{buildingOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCloseBuilding} className="fixed inset-0 z-50 flex cursor-zoom-out flex-col justify-between bg-black/95 p-4 backdrop-blur-lg md:p-8">
      <div className="z-10 flex items-center justify-between text-white"><div><h3 className="text-lg font-semibold">Bâtiment du Sacré Cœur de Jésus</h3><p className="text-xs text-white/70">Vue d'ensemble de nos infrastructures</p></div><button onClick={onCloseBuilding} className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium transition-colors hover:bg-white/20">Réduire</button></div>
      <div className="my-4 flex flex-1 items-center justify-center overflow-hidden" onClick={event => event.stopPropagation()}><motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} src="/batiment-ecole.jpeg" alt="Bâtiment en plein écran" className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl" /></div>
      <p className="text-center text-xs text-white/50">Cliquez autour de l'image ou appuyez sur <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">Échap</kbd> pour revenir.</p>
    </motion.div>}</AnimatePresence>
    <AnimatePresence>{selectedItem && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCloseItem} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md md:p-8">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={event => event.stopPropagation()} className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl md:flex-row">
        <div className="relative flex min-h-75 items-center justify-center bg-black md:w-2/3">{selectedItem.videoSrc ? <video controls autoPlay className="max-h-[70vh] size-full object-contain"><source src={selectedItem.videoSrc} type="video/mp4" /></video> : <img src={selectedItem.src} alt={selectedItem.title} className="max-h-[70vh] size-full object-contain" />}</div>
        <div className="flex flex-col justify-between bg-card p-6 md:w-1/3"><div><span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-sacred-red">{selectedItem.category}</span><h2 className="mb-3 font-display text-2xl font-semibold">{selectedItem.title}</h2><p className="text-sm leading-relaxed opacity-80">{selectedItem.text || 'Aucune description disponible.'}</p></div><button onClick={onCloseItem} className="mt-6 w-full rounded-xl bg-muted py-2.5 text-sm font-medium transition-colors hover:bg-muted/80">Fermer</button></div>
      </motion.div>
    </motion.div>}</AnimatePresence>
  </>
}
