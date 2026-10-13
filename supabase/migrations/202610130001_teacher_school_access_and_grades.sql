-- Teacher read access and academic grades.
-- Apply only after confirming that the deployed schema uses the columns listed here.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.teacher_details_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select td.id
  from public.enseignants_details as td
  where td.user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.teacher_has_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.enseignants_details as td
    where td.user_id = (select auth.uid())
      and p_class_id::text = any(td.assignedclasses)
  );
$$;

create or replace function private.teacher_can_grade(
  p_class_id uuid,
  p_subject text,
  p_school_year text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.enseignants_details as td
    join public.schedule_entries as se on se.teacher_id = td.id
    join public.classes as c on c.id = se.classe_id
    where td.user_id = (select auth.uid())
      and p_class_id::text = any(td.assignedclasses)
      and se.classe_id = p_class_id
      and se.subject = p_subject
      and c.annee_scolaire = p_school_year
  );
$$;

create or replace function private.teacher_can_grade_student(
  p_student_id uuid,
  p_class_id uuid,
  p_subject text,
  p_school_year text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.teacher_can_grade(p_class_id, p_subject, p_school_year)
    and exists (
      select 1 from public.inscriptions as i
      where i.eleve_id = p_student_id
        and i.classe_id = p_class_id
        and i.annee_scolaire = p_school_year
        and i.status = 'accepte'
    );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles as p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.teacher_details_id() from public, anon;
revoke all on function private.teacher_has_class(uuid) from public, anon;
revoke all on function private.teacher_can_grade(uuid, text, text) from public, anon;
revoke all on function private.teacher_can_grade_student(uuid, uuid, text, text) from public, anon;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.teacher_details_id() to authenticated;
grant execute on function private.teacher_has_class(uuid) to authenticated;
grant execute on function private.teacher_can_grade(uuid, text, text) to authenticated;
grant execute on function private.teacher_can_grade_student(uuid, uuid, text, text) to authenticated;
grant execute on function private.is_admin() to authenticated;

-- The admin policies remain in place; this adds a teacher's own row only.
drop policy if exists "Teachers can read their own profile" on public.enseignants_details;
create policy "Teachers can read their own profile"
on public.enseignants_details for select to authenticated
using (user_id = (select auth.uid()));

-- Teachers can read only their own schedule rows.
drop policy if exists "Teachers can read their own schedules" on public.schedule_entries;
create policy "Teachers can read their own schedules"
on public.schedule_entries for select to authenticated
using (teacher_id = (select private.teacher_details_id()));

create or replace function public.get_teacher_assigned_classes(p_school_year text)
returns table(id uuid, nom_classe text, annee_scolaire text, "studentCount" integer)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.nom_classe, c.annee_scolaire,
    (count(i.id) filter (where i.status = 'accepte'))::integer as "studentCount"
  from public.enseignants_details as td
  join public.classes as c on c.id::text = any(td.assignedclasses)
  left join public.inscriptions as i
    on i.classe_id = c.id and i.annee_scolaire = p_school_year
  where td.user_id = (select auth.uid())
    and c.annee_scolaire = p_school_year
  group by c.id, c.nom_classe, c.annee_scolaire
  order by c.nom_classe;
$$;

create or replace function public.get_teacher_class_students(
  p_class_id uuid,
  p_school_year text
)
returns table(id uuid, "firstName" text, "middleName" text, "lastName" text, "className" text)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e."firstName", e."middleName", e."lastName", c.nom_classe as "className"
  from public.inscriptions as i
  join public.eleves_details as e on e.id = i.eleve_id
  join public.classes as c on c.id = i.classe_id
  where i.classe_id = p_class_id
    and i.annee_scolaire = p_school_year
    and i.status = 'accepte'
    and c.annee_scolaire = p_school_year
    and private.teacher_has_class(p_class_id)
  order by e."lastName", e."firstName";
$$;

revoke all on function public.get_teacher_assigned_classes(text) from public, anon;
revoke all on function public.get_teacher_class_students(uuid, text) from public, anon;
grant execute on function public.get_teacher_assigned_classes(text) to authenticated;
grant execute on function public.get_teacher_class_students(uuid, text) to authenticated;

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references public.eleves_details(id) on delete restrict,
  classe_id uuid not null references public.classes(id) on delete restrict,
  teacher_id uuid not null,
  subject text not null check (length(trim(subject)) > 0),
  academic_term smallint not null check (academic_term in (1, 2, 3)),
  score numeric(7, 2) not null check (score >= 0),
  max_score numeric(7, 2) not null check (max_score > 0 and score <= max_score),
  school_year text not null check (length(trim(school_year)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grades_student_class_subject_term_year_key
    unique (eleve_id, classe_id, subject, academic_term, school_year)
);

create trigger grades_set_updated_at
before update on public.grades
for each row execute function private.touch_updated_at();

alter table public.grades enable row level security;
grant select, insert, update on public.grades to authenticated;

create policy "Teachers can read their own grades"
on public.grades for select to authenticated
using (teacher_id = (select auth.uid()));

create policy "Teachers can insert grades for assigned subjects"
on public.grades for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and private.teacher_can_grade_student(eleve_id, classe_id, subject, school_year)
);

create policy "Teachers can update grades for assigned subjects"
on public.grades for update to authenticated
using (
  teacher_id = (select auth.uid())
  and private.teacher_can_grade(classe_id, subject, school_year)
)
with check (
  teacher_id = (select auth.uid())
  and private.teacher_can_grade_student(eleve_id, classe_id, subject, school_year)
);

create policy "Admins can manage grades"
on public.grades for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create index grades_teacher_year_idx on public.grades (teacher_id, school_year);
create index grades_class_year_idx on public.grades (classe_id, school_year);
