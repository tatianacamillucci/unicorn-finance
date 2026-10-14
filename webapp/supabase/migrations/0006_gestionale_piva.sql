-- Gestionale P.IVA: profilo fiscale, clienti, preventivi, fatture, incassi.
-- Solo aggiunte (create table / add column). Nessun drop.

alter table public.conti
  add column ruolo text not null default 'personale'
  check (ruolo in ('personale', 'attivita', 'tasse'));

-- Profilo fiscale (una riga per utente)
create table public.profilo_fiscale (
  user_id uuid primary key references auth.users on delete cascade default auth.uid(),
  ateco text,
  coefficiente numeric(5,4) not null default 0.67,
  aliquota_imposta numeric(5,4) not null default 0.05,
  aliquota_inps numeric(5,4) not null default 0.2607,
  data_apertura date,
  commercialista_nome text,
  commercialista_telefono text,
  commercialista_email text,
  conto_tasse_id uuid references public.conti(id) on delete set null,
  created_at timestamptz not null default now()
);
create index profilo_fiscale_conto_tasse_id_idx on public.profilo_fiscale(conto_tasse_id);
alter table public.profilo_fiscale enable row level security;
create policy "profilo_fiscale_select" on public.profilo_fiscale for select using ((select auth.uid()) = user_id);
create policy "profilo_fiscale_insert" on public.profilo_fiscale for insert with check ((select auth.uid()) = user_id);
create policy "profilo_fiscale_update" on public.profilo_fiscale for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "profilo_fiscale_delete" on public.profilo_fiscale for delete using ((select auth.uid()) = user_id);

-- Clienti
create table public.clienti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  nome text not null,
  piva_cf text,
  email text,
  telefono text,
  note text,
  created_at timestamptz not null default now()
);
create index clienti_user_id_idx on public.clienti(user_id);
alter table public.clienti enable row level security;
create policy "clienti_select" on public.clienti for select using ((select auth.uid()) = user_id);
create policy "clienti_insert" on public.clienti for insert with check ((select auth.uid()) = user_id);
create policy "clienti_update" on public.clienti for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "clienti_delete" on public.clienti for delete using ((select auth.uid()) = user_id);

-- Preventivi
create table public.preventivi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  cliente_id uuid not null references public.clienti(id) on delete cascade,
  numero text,
  data date not null default current_date,
  descrizione text not null,
  importo numeric(12,2) not null check (importo >= 0),
  stato text not null default 'bozza' check (stato in ('bozza', 'inviato', 'accettato', 'rifiutato')),
  created_at timestamptz not null default now()
);
create index preventivi_user_id_idx on public.preventivi(user_id);
create index preventivi_cliente_id_idx on public.preventivi(cliente_id);
alter table public.preventivi enable row level security;
create policy "preventivi_select" on public.preventivi for select using ((select auth.uid()) = user_id);
create policy "preventivi_insert" on public.preventivi for insert with check ((select auth.uid()) = user_id);
create policy "preventivi_update" on public.preventivi for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "preventivi_delete" on public.preventivi for delete using ((select auth.uid()) = user_id);

-- Fatture
create table public.fatture (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  cliente_id uuid not null references public.clienti(id) on delete cascade,
  preventivo_id uuid references public.preventivi(id) on delete set null,
  numero text,
  data_emissione date,
  descrizione text not null,
  importo numeric(12,2) not null check (importo >= 0),
  bollo numeric(12,2) not null default 0 check (bollo >= 0),
  stato text not null default 'da_emettere' check (stato in ('da_emettere', 'emessa', 'incassata')),
  created_at timestamptz not null default now()
);
create index fatture_user_id_idx on public.fatture(user_id);
create index fatture_cliente_id_idx on public.fatture(cliente_id);
create index fatture_preventivo_id_idx on public.fatture(preventivo_id);
alter table public.fatture enable row level security;
create policy "fatture_select" on public.fatture for select using ((select auth.uid()) = user_id);
create policy "fatture_insert" on public.fatture for insert with check ((select auth.uid()) = user_id);
create policy "fatture_update" on public.fatture for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "fatture_delete" on public.fatture for delete using ((select auth.uid()) = user_id);

-- Incassi
create table public.incassi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  fattura_id uuid references public.fatture(id) on delete set null,
  cliente_id uuid not null references public.clienti(id) on delete cascade,
  data date not null default current_date,
  importo numeric(12,2) not null check (importo >= 0),
  accantonamento_imposta numeric(12,2) not null default 0 check (accantonamento_imposta >= 0),
  accantonamento_inps numeric(12,2) not null default 0 check (accantonamento_inps >= 0),
  conto_destinazione_id uuid references public.conti(id) on delete set null,
  spostato boolean not null default false,
  created_at timestamptz not null default now()
);
create index incassi_user_id_idx on public.incassi(user_id);
create index incassi_fattura_id_idx on public.incassi(fattura_id);
create index incassi_cliente_id_idx on public.incassi(cliente_id);
create index incassi_conto_destinazione_id_idx on public.incassi(conto_destinazione_id);
alter table public.incassi enable row level security;
create policy "incassi_select" on public.incassi for select using ((select auth.uid()) = user_id);
create policy "incassi_insert" on public.incassi for insert with check ((select auth.uid()) = user_id);
create policy "incassi_update" on public.incassi for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "incassi_delete" on public.incassi for delete using ((select auth.uid()) = user_id);
