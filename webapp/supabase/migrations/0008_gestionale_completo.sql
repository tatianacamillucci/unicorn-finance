-- Gestionale completo: righe documento, scadenze, listino servizi, spese, intestazione.
-- Solo aggiunte (create table / add column). Nessun drop. NON ancora applicata.

alter table public.fatture
  add column righe jsonb not null default '[]'::jsonb,
  add column scadenza_pagamento date;

alter table public.preventivi
  add column righe jsonb not null default '[]'::jsonb,
  add column validita date;

alter table public.profilo_fiscale
  add column ragione_sociale text,
  add column indirizzo text,
  add column piva text,
  add column iban text;

-- Listino servizi
create table public.servizi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  nome text not null,
  descrizione text,
  prezzo numeric(12,2) not null default 0 check (prezzo >= 0),
  unita text not null default 'una tantum' check (unita in ('una tantum', 'mese', 'ora', 'giorno')),
  attivo boolean not null default true,
  created_at timestamptz not null default now()
);
create index servizi_user_id_idx on public.servizi(user_id);
alter table public.servizi enable row level security;
create policy "servizi_select" on public.servizi for select using ((select auth.uid()) = user_id);
create policy "servizi_insert" on public.servizi for insert with check ((select auth.uid()) = user_id);
create policy "servizi_update" on public.servizi for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "servizi_delete" on public.servizi for delete using ((select auth.uid()) = user_id);

-- Spese (costi e fornitori)
create table public.spese (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  data date not null default current_date,
  fornitore text not null,
  descrizione text,
  categoria text,
  importo numeric(12,2) not null check (importo >= 0),
  pagata boolean not null default true,
  created_at timestamptz not null default now()
);
create index spese_user_id_idx on public.spese(user_id);
create index spese_data_idx on public.spese(data);
alter table public.spese enable row level security;
create policy "spese_select" on public.spese for select using ((select auth.uid()) = user_id);
create policy "spese_insert" on public.spese for insert with check ((select auth.uid()) = user_id);
create policy "spese_update" on public.spese for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "spese_delete" on public.spese for delete using ((select auth.uid()) = user_id);
