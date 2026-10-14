import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";

const CATEGORIE_USCITA = [
  { nome: "Spesa", emoji: "🛒", colore_hex: "#5FB88F" },
  { nome: "Casa", emoji: "🏠", colore_hex: "#B9E3FF" },
  { nome: "Bollette", emoji: "💡", colore_hex: "#FFE29A" },
  { nome: "Trasporti", emoji: "🚌", colore_hex: "#FFCBA4" },
  { nome: "Ristoranti", emoji: "🍕", colore_hex: "#FFC1D9" },
  { nome: "Salute", emoji: "💊", colore_hex: "#B7F0D0" },
  { nome: "Abbigliamento", emoji: "👕", colore_hex: "#FF9E9E" },
  { nome: "Svago", emoji: "🎬", colore_hex: "#E8B4FF" },
  { nome: "Abbonamenti", emoji: "📱", colore_hex: "#A4D8FF" },
  { nome: "Viaggi", emoji: "✈️", colore_hex: "#FFD6A4" },
  { nome: "Regali", emoji: "🎁", colore_hex: "#FFB4D1" },
  { nome: "Altro", emoji: "💰", colore_hex: "#7C8F72" },
];

const CATEGORIE_ENTRATA = [
  { nome: "Stipendio", emoji: "💼", colore_hex: "#5FB88F" },
  { nome: "Entrate extra", emoji: "💵", colore_hex: "#B7F0D0" },
  { nome: "Rimborsi", emoji: "↩️", colore_hex: "#B9E3FF" },
];

const CONTI = [
  { nome: "Conto corrente", tipo: "banca", icona_emoji: "🏦", colore_hex: "#5FB88F" },
  { nome: "Contanti", tipo: "contanti", icona_emoji: "👛", colore_hex: "#FFE29A" },
  { nome: "Carta", tipo: "carta", icona_emoji: "💳", colore_hex: "#B9E3FF" },
];

/**
 * Creates a starter set of categorie and conti the first time a user opens the
 * app. Without these the "Aggiungi movimento" form has empty selects and no
 * movimento can be saved at all, so the app is unusable until they exist.
 *
 * Runs on Home page load, like reconcileRicorrenzeMensili. Idempotent: each
 * table is seeded only when the user has none, so a user who deleted a default
 * category on purpose never gets it back.
 */
export async function assicuraSetupIniziale(): Promise<void> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return;
  const userId = userData.user.id;

  const { count: categorieCount, error: categorieCountError } = await supabase
    .from("categorie")
    .select("id", { count: "exact", head: true });
  if (categorieCountError) {
    logServerError("assicuraSetupIniziale/countCategorie", categorieCountError);
    return;
  }

  if (categorieCount === 0) {
    const righe = [
      ...CATEGORIE_USCITA.map((c) => ({ ...c, tipo: "uscita", user_id: userId })),
      ...CATEGORIE_ENTRATA.map((c) => ({ ...c, tipo: "entrata", user_id: userId })),
    ];
    const { error } = await supabase.from("categorie").insert(righe);
    if (error) logServerError("assicuraSetupIniziale/insertCategorie", error);
  }

  const { count: contiCount, error: contiCountError } = await supabase
    .from("conti")
    .select("id", { count: "exact", head: true });
  if (contiCountError) {
    logServerError("assicuraSetupIniziale/countConti", contiCountError);
    return;
  }

  if (contiCount === 0) {
    const righe = CONTI.map((c) => ({ ...c, user_id: userId }));
    const { error } = await supabase.from("conti").insert(righe);
    if (error) logServerError("assicuraSetupIniziale/insertConti", error);
  }
}
