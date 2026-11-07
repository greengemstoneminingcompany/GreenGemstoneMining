create table if not exists public.lead_workflow (
  lead_id uuid primary key references public.leads(id) on delete cascade,
  assignee text not null default '' check (length(assignee) <= 120),
  status text not null default 'New' check (status in ('New', 'In progress', 'Follow up', 'Closed'))
);
alter table public.lead_workflow enable row level security;
revoke all on public.lead_workflow from public, anon, authenticated;
grant select, insert, update on public.lead_workflow to authenticated;
create policy lead_workflow_admin on public.lead_workflow
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
