create or replace function public.seed_default_data()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categorie (user_id, nome, tipo, colore_hex, emoji) values
    (new.id, 'Cibo', 'uscita', '#F9591F', '🍔'),
    (new.id, 'Trasporti', 'uscita', '#51BBFE', '🚗'),
    (new.id, 'Casa', 'uscita', '#4ABA94', '🏠'),
    (new.id, 'Svago', 'uscita', '#FF5E97', '🎉'),
    (new.id, 'Shopping', 'uscita', '#FEC631', '👕'),
    (new.id, 'Salute', 'uscita', '#DD5341', '💊'),
    (new.id, 'Bollette', 'uscita', '#685B53', '📱'),
    (new.id, 'Stipendio', 'entrata', '#4ABA94', '💰'),
    (new.id, 'Regalo', 'entrata', '#FF5E97', '🎁');

  insert into public.conti (user_id, nome, tipo, colore_hex, icona_emoji) values
    (new.id, 'Conto Principale', 'corrente', '#51BBFE', '💳');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_default_data();

-- backfill per chi si è già registrato prima di questo trigger
insert into public.categorie (user_id, nome, tipo, colore_hex, emoji)
select u.id, v.nome, v.tipo, v.colore_hex, v.emoji
from auth.users u
cross join (values
  ('Cibo','uscita','#F9591F','🍔'),
  ('Trasporti','uscita','#51BBFE','🚗'),
  ('Casa','uscita','#4ABA94','🏠'),
  ('Svago','uscita','#FF5E97','🎉'),
  ('Shopping','uscita','#FEC631','👕'),
  ('Salute','uscita','#DD5341','💊'),
  ('Bollette','uscita','#685B53','📱'),
  ('Stipendio','entrata','#4ABA94','💰'),
  ('Regalo','entrata','#FF5E97','🎁')
) as v(nome, tipo, colore_hex, emoji)
where not exists (select 1 from public.categorie c where c.user_id = u.id);

insert into public.conti (user_id, nome, tipo, colore_hex, icona_emoji)
select u.id, 'Conto Principale', 'corrente', '#51BBFE', '💳'
from auth.users u
where not exists (select 1 from public.conti c where c.user_id = u.id);
