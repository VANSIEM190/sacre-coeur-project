import { Filter, Search } from "lucide-react";
import type { ClassName } from "@sacre-coeur/domain/types";

interface CourseFiltersProps {
  classes: ClassName[];
  searchQuery: string;
  selectedClass: string;
  onSearchChange: (value: string) => void;
  onClassChange: (value: string) => void;
}

export function CourseFilters({
  classes,
  searchQuery,
  selectedClass,
  onSearchChange,
  onClassChange,
}: CourseFiltersProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-3.5 size-4 opacity-40" />
        <input
          type="text"
          placeholder="Rechercher un cours..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div className="relative min-w-50">
        <Filter className="absolute left-4 top-3.5 size-4 opacity-40" />
        <select
          value={selectedClass}
          onChange={(event) => onClassChange(event.target.value)}
          className="w-full cursor-pointer appearance-none rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
        >
          <option value="Tous">Toutes les classes</option>
          {classes.map((classe) => (
            <option key={classe.id} value={classe.nom_classe}>
              {classe.nom_classe}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
