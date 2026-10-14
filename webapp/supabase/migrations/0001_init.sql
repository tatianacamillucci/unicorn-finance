create table conti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  tipo text not null,
  saldo_iniziale numeric not null default 0,
  data_saldo_iniziale date not null default current_date,
  colore_hex text not null default '#51BBFE',
  icona_emoji text not null default '💳'
);

create table categorie (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('entrata', 'uscita')),
  colore_hex text not null default '#4ABA94',
  emoji text not null default '💰'
);

create table ricorrenti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  conto_id uuid not null references conti(id) on delete cascade,
  categoria_id uuid not null references categorie(id) on delete cascade,
  importo numeric not null,
  frequenza text not null,
  giorno_del_mese int,
  data_inizio date not null,
  data_fine date,
  attivo boolean not null default true
);

create table movimenti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null default current_date,
  conto_id uuid not null references conti(id) on delete cascade,
  categoria_id uuid not null references categorie(id) on delete cascade,
  descrizione text,
  luogo text,
  importo numeric not null,
  stato text not null default 'effettuato',
  ricorrente_id uuid references ricorrenti(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table budget_categorie (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria_id uuid not null references categorie(id) on delete cascade,
  importo numeric not null,
  unique (user_id, categoria_id)
);

create table punti_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null default current_date,
  delta int not null,
  motivo text not null
);

create table premi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  punti_richiesti int not null,
  nota text,
  attivo boolean not null default true
);

create table premi_riscattati (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  premio_id uuid not null references premi(id) on delete cascade,
  data_riscatto timestamptz not null default now()
);

alter table conti enable row level security;
alter table categorie enable row level security;
alter table ricorrenti enable row level security;
alter table movimenti enable row level security;
alter table budget_categorie enable row level security;
alter table punti_log enable row level security;
alter table premi enable row level security;
alter table premi_riscattati enable row level security;

create policy "conti_owner" on conti for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categorie_owner" on categorie for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ricorrenti_owner" on ricorrenti for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "movimenti_owner" on movimenti for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budget_categorie_owner" on budget_categorie for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "punti_log_owner" on punti_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "premi_owner" on premi for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "premi_riscattati_owner" on premi_riscattati for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
