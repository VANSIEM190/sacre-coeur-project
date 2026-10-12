import { useState } from "react";
import { PageHeader } from "@sacre-coeur/ui/layouts/dashboard-shell";
import { Loader2, Search } from "lucide-react";
import StudentProfile from "@sacre-coeur/school-features/students/components/StudentProfile";
import { useTeacherClasses } from "../hooks/useTeacherClasses";

export default function TeacherClassesPage() {
  const classes = useTeacherClasses();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const selectedStudent = classes.students.find(
    (student) => student.id === selectedStudentId,
  );

  if (classes.isLoading && !classes.assignedClasses.length)
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="size-7 animate-spin" />
      </div>
    );
  if (classes.error)
    return (
      <p
        role="alert"
        className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive"
      >
        Impossible de charger les classes du professeur.
      </p>
    );

  if (selectedStudent)
    return (
      <section className="space-y-4">
        <button
          type="button"
          onClick={() => setSelectedStudentId(null)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Retour à la classe
        </button>
        <StudentProfile student={selectedStudent} />
      </section>
    );

  return (
    <section className="space-y-6">
      <PageHeader
        title="Mes classes"
        subtitle="Les classes et matières proviennent des affectations et des horaires enregistrés par l’administration."
      />
      {!classes.assignedClasses.length ? (
        <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
          Aucune classe ne vous est attribuée pour {classes.schoolYear}.
          Contactez l’administration.
        </p>
      ) : (
        <>
          <label className="grid max-w-md gap-1 text-sm font-medium">
            Classe attribuée
            <select
              value={classes.selectedIdClasse}
              onChange={(event) =>
                classes.setSelectedIdClasse(event.target.value)
              }
              className="rounded-lg border border-border bg-background px-3 py-2"
            >
              {classes.assignedClasses.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.nom_classe}
                </option>
              ))}
            </select>
          </label>
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold">Matières liées à cette classe</h2>
            {classes.isLoadingSubjects ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Chargement des horaires…
              </p>
            ) : classes.subjects.length ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {classes.subjects.map((subject) => (
                  <li
                    key={subject}
                    className="rounded-full bg-muted px-3 py-1 text-sm"
                  >
                    {subject}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Aucune matière ne vous est liée dans l’horaire de cette classe.
              </p>
            )}
          </section>
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={classes.studentSearchQuery}
              onChange={(event) =>
                classes.setStudentSearchQuery(event.target.value)
              }
              placeholder="Rechercher un élève"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
            />
          </label>
          {classes.isLoadingStudents ? (
            <div className="flex justify-center p-8">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {classes.students.map((student) => (
                <li key={student.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentId(student.id)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/40"
                  >
                    <span className="font-medium">
                      {[student.firstName, student.middleName, student.lastName]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {student.phone}
                    </span>
                  </button>
                </li>
              ))}
              {classes.students.length === 0 && (
                <li className="p-4 text-center text-sm text-muted-foreground">
                  Aucun élève trouvé.
                </li>
              )}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
