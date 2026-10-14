import { useSchoolGallery } from "../hooks/useSchoolGallery";
import { PublicHeader } from "@/layouts/public-header";
import { PublicFooter } from "@/layouts/public-footer";

import { SchoolGallery, SchoolIntro } from "../components/SchoolGallery";
import { SchoolGalleryDialogs } from "../components/SchoolGalleryDialogs";
import { GALLERY_ITEMS } from "../data/galery";

export default function EcolePage() {
  const gallery = useSchoolGallery(GALLERY_ITEMS);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <PublicHeader />
      <SchoolIntro
        onBuildingOpen={() => gallery.setIsBuildingFullscreen(true)}
      />
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
  );
}
