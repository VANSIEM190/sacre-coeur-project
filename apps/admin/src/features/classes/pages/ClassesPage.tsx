import { useState } from "react";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { PageHeader } from "@sacre-coeur/ui/layouts/dashboard-shell";
import type { ClassName, EleveDetails } from "@sacre-coeur/domain/types";
import { getCurrentSchoolYear } from "@sacre-coeur/domain/utils/getCurrentSchoolYear";
import StudentProfile from "@sacre-coeur/school-features/students/components/StudentProfile";
import { useAdminClasses } from "../hooks/useAdminClasses";
import { ClassFormDialog } from "../components/ClassFormDialog";
import { ClassStudentList } from "../components/ClassStudentList";
import { ClassGrid } from "../components/ClassGrid";

export default function ClassesPage() {
  const currentYear = getCurrentSchoolYear();
  const [selectedClass, setSelectedClass] = useState<ClassName | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<EleveDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassName | null>(null);
  const [className, setClassName] = useState("");
  const [schoolYear, setSchoolYear] = useState(currentYear);
  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingClass(null);
    setClassName("");
    setSchoolYear(currentYear);
  };

  const data = useAdminClasses(selectedClass?.id ?? "", closeDialog);
  const classes = data.classesQuery.data ?? [];
  const students = data.studentsQuery.data ?? [];
  const isSavingClass = data.createClass.isPending || data.updateClass.isPending;

  const openCreateDialog = () => {
    setEditingClass(null);
    setClassName("");
    setSchoolYear(currentYear);
    setIsDialogOpen(true);
  };

  const openEditDialog = (schoolClass: ClassName) => {
    setEditingClass(schoolClass);
    setClassName(schoolClass.nom_classe);
    setSchoolYear(schoolClass.annee_scolaire);
    setIsDialogOpen(true);
  };

  const submitClass = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!className.trim()) return;
    if (editingClass) {
      data.updateClass.mutate({ id: editingClass.id, name: className, year: schoolYear });
    } else {
      data.createClass.mutate({ name: className, year: schoolYear });
    }
  };

  const deleteClass = (schoolClass: ClassName) => {
    if (window.confirm(`Voulez-vous vraiment supprimer la classe ${schoolClass.nom_classe} ?`)) {
      data.deleteClass.mutate(schoolClass.id);
    }
  };

  if (selectedStudent) {
    return (
      <div>
        <button type="button" onClick={() => setSelectedStudent(null)} className="mb-4 flex items-center gap-2 text-sm opacity-60 hover:opacity-100">
          <ArrowLeft className="size-4" /> Retour à la classe
        </button>
        <StudentProfile student={selectedStudent} />
      </div>
    );
  }

  if (selectedClass) {
    if (data.studentsQuery.isLoading) {
      return <div className="flex flex-col items-center justify-center gap-3 py-24 opacity-60"><Loader2 className="size-8 animate-spin text-primary" /><p className="text-sm">Chargement des élèves...</p></div>;
    }
    if (data.studentsQuery.isError) {
      return <p role="alert" className="py-12 text-center text-sm text-destructive">Impossible de charger les élèves de cette classe.</p>;
    }
    return (
      <section className="space-y-4">
        <button type="button" onClick={() => { setSelectedClass(null); setSearchQuery(""); }} className="mb-2 flex items-center gap-2 text-sm opacity-60 hover:opacity-100">
          <ArrowLeft className="size-4" /> Retour aux classes
        </button>
        <PageHeader title={selectedClass.nom_classe} subtitle={`${students.length} élève(s) dans cette classe`} />
        <ClassStudentList students={students} searchQuery={searchQuery} onSearchChange={setSearchQuery} onSelectStudent={setSelectedStudent} />
      </section>
    );
  }

  return (
    <div className="relative">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Classes" subtitle="Cliquez sur une classe pour voir les élèves." />
        <button type="button" onClick={openCreateDialog} className="flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-primary px-5 font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:self-auto">
          <Plus className="size-5" /> Créer une classe
        </button>
      </div>

      {data.classesQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 opacity-60"><Loader2 className="size-8 animate-spin text-primary" /><p className="text-sm">Chargement des classes...</p></div>
      ) : data.classesQuery.isError ? (
        <p role="alert" className="py-12 text-center text-sm text-destructive">Une erreur est survenue lors de la récupération des données.</p>
      ) : (
        <ClassGrid
          classes={classes}
          isDeleting={data.deleteClass.isPending}
          onOpen={setSelectedClass}
          onEdit={openEditDialog}
          onDelete={deleteClass}
        />
      )}

      <ClassFormDialog
        isOpen={isDialogOpen}
        editingClass={editingClass}
        name={className}
        schoolYear={schoolYear}
        isSaving={isSavingClass}
        onNameChange={setClassName}
        onSchoolYearChange={setSchoolYear}
        onClose={closeDialog}
        onSubmit={submitClass}
      />
    </div>
  );
}
