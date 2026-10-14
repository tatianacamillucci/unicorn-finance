-- Indici sulle foreign key (segnalati come mancanti dall'advisor performance)
create index if not exists idx_conti_user_id on conti(user_id);
create index if not exists idx_categorie_user_id on categorie(user_id);
create index if not exists idx_ricorrenti_user_id on ricorrenti(user_id);
create index if not exists idx_ricorrenti_conto_id on ricorrenti(conto_id);
create index if not exists idx_ricorrenti_categoria_id on ricorrenti(categoria_id);
create index if not exists idx_movimenti_user_id on movimenti(user_id);
create index if not exists idx_movimenti_conto_id on movimenti(conto_id);
create index if not exists idx_movimenti_categoria_id on movimenti(categoria_id);
create index if not exists idx_movimenti_ricorrente_id on movimenti(ricorrente_id);
create index if not exists idx_budget_categorie_categoria_id on budget_categorie(categoria_id);
create index if not exists idx_punti_log_user_id on punti_log(user_id);
create index if not exists idx_premi_user_id on premi(user_id);
create index if not exists idx_premi_riscattati_user_id on premi_riscattati(user_id);
create index if not exists idx_premi_riscattati_premio_id on premi_riscattati(premio_id);

-- Ottimizzazione RLS: (select auth.uid()) viene valutato una volta per query
-- invece che una volta per riga (auth_rls_initplan)
drop policy "conti_owner" on conti;
create policy "conti_owner" on conti for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "categorie_owner" on categorie;
create policy "categorie_owner" on categorie for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "ricorrenti_owner" on ricorrenti;
create policy "ricorrenti_owner" on ricorrenti for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "movimenti_owner" on movimenti;
create policy "movimenti_owner" on movimenti for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "budget_categorie_owner" on budget_categorie;
create policy "budget_categorie_owner" on budget_categorie for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "punti_log_owner" on punti_log;
create policy "punti_log_owner" on punti_log for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "premi_owner" on premi;
create policy "premi_owner" on premi for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "premi_riscattati_owner" on premi_riscattati;
create policy "premi_riscattati_owner" on premi_riscattati for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
