-- Allow a teacher to delete only a grading sheet owned by their signed-in account.
create or replace function public.delete_teacher_grade_sheet(p_grade_sheet_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  delete from public.grade_sheets
  where id = p_grade_sheet_id
    and teacher_id = (select auth.uid())
  returning id into v_deleted_id;

  return v_deleted_id is not null;
end;
$$;

revoke all on function public.delete_teacher_grade_sheet(uuid) from public, anon;
grant execute on function public.delete_teacher_grade_sheet(uuid) to authenticated;
