import type { TeacherRosterStudent } from "@sacre-coeur/domain/types";

type TeacherStudentAcademicProfileProps = {
  student: TeacherRosterStudent;
};

export default function TeacherStudentAcademicProfile({
  student,
}: TeacherStudentAcademicProfileProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h1 className="font-display text-2xl">
        {[student.firstName, student.middleName, student.lastName]
          .filter(Boolean)
          .join(" ")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Classe : {student.className}
      </p>
    </section>
  );
}
