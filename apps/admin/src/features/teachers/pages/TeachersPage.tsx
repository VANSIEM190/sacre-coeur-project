import { PageHeader } from "@sacre-coeur/ui/layouts/dashboard-shell";
import { SupabaseErrorHandler } from "@sacre-coeur/school-features/feedback/supabase-error-handler";
import type { TeacherUser } from "@sacre-coeur/domain/types";
import type { RegisterTeacherInput } from "@sacre-coeur/data-access/services/teacher/teacher.service";
import { toast } from "sonner";
import { TeacherForm } from "../components/TeacherForm";
import { TeacherList } from "../components/TeacherList";
import { useAdminTeachers } from "../hooks/useAdminTeachers";

export default function TeachersPage() {
  const {
    teachersQuery,
    classesQuery,
    createTeacher,
    updateTeacher,
    deleteTeacher,
  } = useAdminTeachers();
  const teachers = teachersQuery.data ?? [];
  const classes = classesQuery.data ?? [];
  const busyTeacherId = (() => {
    if (updateTeacher.isPending && updateTeacher.variables)
      return updateTeacher.variables.id;
    if (deleteTeacher.isPending && deleteTeacher.variables)
      return deleteTeacher.variables;
    return undefined;
  })();

  const copyAccessId = async (accessId: string) => {
    try {
      await navigator.clipboard.writeText(accessId);
      toast.success("Matricule d’activation copié.");
    } catch (error) {
      SupabaseErrorHandler.handle(error);
    }
  };

  const confirmDelete = (teacher: TeacherUser) => {
    if (window.confirm(`Supprimer le compte de ${teacher.fullName} ?`))
      deleteTeacher.mutate(teacher.id);
  };

  const submitTeacher = (values: RegisterTeacherInput) =>
    createTeacher.mutate(values);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Enseignants"
        subtitle="Créez les fiches, attribuez les classes et transmettez les matricules d’activation."
      />
      <TeacherForm
        key={teachers.length}
        classes={classes}
        isLoadingClasses={classesQuery.isLoading}
        classesError={classesQuery.isError}
        isSubmitting={createTeacher.isPending}
        onSubmit={submitTeacher}
      />
      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">
          Professeurs enregistrés
        </h2>
        {classesQuery.isError && (
          <p role="alert" className="text-sm text-destructive">
            Les affectations de classes ne sont pas disponibles.
          </p>
        )}
        <TeacherList
          teachers={teachers}
          classes={classes}
          isLoading={teachersQuery.isLoading}
          error={teachersQuery.isError}
          busyTeacherId={busyTeacherId}
          onCopyAccessId={(accessId) => void copyAccessId(accessId)}
          onDelete={confirmDelete}
          onSaveClasses={async (id, assignedclasses) => {
            await updateTeacher.mutateAsync({ id, assignedclasses });
          }}
        />
      </section>
    </section>
  );
}
