create table public.stato_utente (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ultimo_mese_popup_entrate text
);

alter table public.stato_utente enable row level security;

create policy "stato_utente_owner" on public.stato_utente for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
