-- Normalize cotation: one header per class/teacher/subject/term/year, one score row per student.
create table public.grade_sheets (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid not null references public.classes(id) on delete restrict,
  teacher_id uuid not null,
  subject text not null check (length(trim(subject)) > 0),
  academic_term smallint not null check (academic_term in (1, 2, 3)),
  max_score numeric(7, 2) not null check (max_score > 0),
  school_year text not null check (length(trim(school_year)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grade_sheets_class_teacher_subject_term_year_key
    unique (classe_id, teacher_id, subject, academic_term, school_year)
);

-- Preserve previously entered scores and choose a shared maximum that covers all of them.
insert into public.grade_sheets (
  classe_id, teacher_id, subject, academic_term, max_score, school_year, created_at, updated_at
)
select classe_id, teacher_id, subject, academic_term, max(max_score), school_year,
  min(created_at), max(updated_at)
from public.grades
group by classe_id, teacher_id, subject, academic_term, school_year
on conflict (classe_id, teacher_id, subject, academic_term, school_year) do nothing;

alter table public.grades add column grade_sheet_id uuid;
update public.grades as g
set grade_sheet_id = s.id
from public.grade_sheets as s
where s.classe_id = g.classe_id
  and s.teacher_id = g.teacher_id
  and s.subject = g.subject
  and s.academic_term = g.academic_term
  and s.school_year = g.school_year;

alter table public.grades
  alter column grade_sheet_id set not null,
  add constraint grades_grade_sheet_id_fkey
    foreign key (grade_sheet_id) references public.grade_sheets(id) on delete cascade,
  add constraint grades_grade_sheet_student_key unique (grade_sheet_id, eleve_id);

drop policy if exists "Teachers can read their own grades" on public.grades;
drop policy if exists "Teachers can insert grades for assigned subjects" on public.grades;
drop policy if exists "Teachers can update grades for assigned subjects" on public.grades;
drop policy if exists "Admins can manage grades" on public.grades;
alter table public.grades drop constraint if exists grades_student_class_subject_term_year_key;

drop index if exists public.grades_teacher_year_idx;
drop index if exists public.grades_class_year_idx;
alter table public.grades
  drop column classe_id,
  drop column teacher_id,
  drop column subject,
  drop column academic_term,
  drop column max_score,
  drop column school_year;

create trigger grade_sheets_set_updated_at
before update on public.grade_sheets
for each row execute function private.touch_updated_at();

alter table public.grade_sheets enable row level security;
alter table public.grades enable row level security;
grant select, insert, update, delete on public.grade_sheets to authenticated;
grant select, insert, update, delete on public.grades to authenticated;

create policy "Teachers can read their own grade sheets"
on public.grade_sheets for select to authenticated
using (teacher_id = (select auth.uid()));

create policy "Admins can manage grade sheets"
on public.grade_sheets for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create or replace function private.teacher_owns_grade_sheet(p_grade_sheet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.grade_sheets as s
    where s.id = p_grade_sheet_id
      and s.teacher_id = (select auth.uid())
  );
$$;

revoke all on function private.teacher_owns_grade_sheet(uuid) from public, anon;
grant execute on function private.teacher_owns_grade_sheet(uuid) to authenticated;

create policy "Teachers can read grades in their own sheets"
on public.grades for select to authenticated
using (private.teacher_owns_grade_sheet(grade_sheet_id));

create policy "Admins can manage grades"
on public.grades for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create or replace function public.save_teacher_grade_sheet(
  p_classe_id uuid,
  p_subject text,
  p_academic_term smallint,
  p_max_score numeric,
  p_school_year text,
  p_scores jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sheet_id uuid;
  v_entry jsonb;
  v_student_id uuid;
  v_score numeric;
  v_expected_count bigint;
  v_input_count bigint;
  v_unique_count bigint;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_academic_term not in (1, 2, 3) or p_max_score <= 0 then
    raise exception 'Invalid grading period or maximum score.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_scores) <> 'array' then
    raise exception 'Scores must be an array.' using errcode = '22023';
  end if;
  if not private.teacher_can_grade(p_classe_id, p_subject, p_school_year) then
    raise exception 'Teacher is not assigned to this class and subject.' using errcode = '42501';
  end if;

  select count(*) into v_expected_count
  from public.inscriptions as i
  where i.classe_id = p_classe_id
    and i.annee_scolaire = p_school_year
    and i.status = 'accepte';

  select count(*), count(distinct value ->> 'eleve_id')
  into v_input_count, v_unique_count
  from jsonb_array_elements(p_scores);

  if v_input_count = 0 or v_input_count <> v_expected_count or v_input_count <> v_unique_count then
    raise exception 'Submit exactly one score for each accepted student.' using errcode = '22023';
  end if;

  for v_entry in select value from jsonb_array_elements(p_scores)
  loop
    v_student_id := (v_entry ->> 'eleve_id')::uuid;
    v_score := (v_entry ->> 'score')::numeric;
    if v_score < 0 or v_score > p_max_score
      or not private.teacher_can_grade_student(v_student_id, p_classe_id, p_subject, p_school_year) then
      raise exception 'A score or student is not valid for this sheet.' using errcode = '22023';
    end if;
  end loop;

  insert into public.grade_sheets (
    classe_id, teacher_id, subject, academic_term, max_score, school_year
  )
  values (
    p_classe_id, (select auth.uid()), trim(p_subject), p_academic_term, p_max_score, trim(p_school_year)
  )
  on conflict (classe_id, teacher_id, subject, academic_term, school_year)
  do update set max_score = excluded.max_score, updated_at = now()
  returning id into v_sheet_id;

  insert into public.grades (grade_sheet_id, eleve_id, score)
  select v_sheet_id, (value ->> 'eleve_id')::uuid, (value ->> 'score')::numeric
  from jsonb_array_elements(p_scores)
  on conflict (grade_sheet_id, eleve_id)
  do update set score = excluded.score, updated_at = now();

  return v_sheet_id;
end;
$$;

revoke all on function public.save_teacher_grade_sheet(uuid, text, smallint, numeric, text, jsonb) from public, anon;
grant execute on function public.save_teacher_grade_sheet(uuid, text, smallint, numeric, text, jsonb) to authenticated;

create index grade_sheets_teacher_year_idx on public.grade_sheets (teacher_id, school_year);
create index grades_grade_sheet_idx on public.grades (grade_sheet_id);
