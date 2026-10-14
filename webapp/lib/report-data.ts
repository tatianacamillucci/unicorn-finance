// Fotografia unica dei dati del gestionale (fatture, incassi, spese, preventivi) + calcoli puri
// usati da Oggi, Scadenzario, Report, Incassi e Tasse. Solo lettura.
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/log-error";
import { isDemo } from "@/lib/demo/mode";
import { getDemoDataset } from "@/lib/demo";
import { getProfiloFiscale } from "@/lib/profilo-fiscale";
import { getProfilo } from "@/lib/profilo";
import { annoAperturaDa } from "@/lib/profilo-utils";
import type {
  Cliente,
  Fattura,
  Incasso,
  Preventivo,
  ProfiloFiscale,
  Spesa,
} from "@/lib/types/gestionale";

export interface Snapshot {
  dbPronto: boolean;
  demo: boolean;
  oggi: string; // YYYY-MM-DD
  anno: number;
  nickname: string | null;
  profilo: ProfiloFiscale;
  annoApertura: number;
  clienti: Pick<Cliente, "id" | "nome">[];
  fatture: Fattura[];
  incassi: Incasso[];
  spese: Spesa[];
  preventivi: Pick<Preventivo, "id" | "stato" | "data">[];
}

export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const pad = (n: number) => String(n).padStart(2, "0");
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function aggiungiGiorni(s: string, n: number): string {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return isoDate(dt);
}
export function giorniTra(da: string, a: string): number {
  const p = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((p(a) - p(da)) / 86400000);
}
export const dataIt = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });

export const getSnapshot = cache(async (): Promise<Snapshot> => {
  const oggiD = new Date();
  const base: Snapshot = {
    dbPronto: false,
    demo: false,
    oggi: isoDate(oggiD),
    anno: oggiD.getFullYear(),
    nickname: null,
    profilo: await getProfiloFiscale(),
    annoApertura: 2027,
    clienti: [],
    fatture: [],
    incassi: [],
    spese: [],
    preventivi: [],
  };
  base.annoApertura = annoAperturaDa(base.profilo);
  try {
    if (await isDemo()) {
      const d = getDemoDataset();
      return {
        ...base,
        dbPronto: true,
        demo: true,
        oggi: d.oggi,
        anno: d.anno,
        nickname: "Tatiana",
        profilo: d.profilo,
        annoApertura: annoAperturaDa(d.profilo),
        clienti: d.clienti,
        fatture: d.fatture,
        incassi: d.incassi,
        spese: d.spese,
        preventivi: d.preventivi,
      };
    }
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return base;
    const uid = userData.user.id;
    let nickname: string | null = null;
    try {
      nickname = (await getProfilo()).nickname;
    } catch (e) {
      logServerError("getSnapshot.nickname", e);
    }
    const [cl, fa, inc, sp, pre] = await Promise.all([
      supabase.from("clienti").select("id, nome").eq("user_id", uid),
      supabase.from("fatture").select("*").eq("user_id", uid),
      supabase.from("incassi").select("*").eq("user_id", uid),
      supabase.from("spese").select("*").eq("user_id", uid), // tabella della 0008: puo' mancare
      supabase.from("preventivi").select("id, stato, data").eq("user_id", uid),
    ]);
    if (cl.error) throw cl.error;
    if (fa.error) throw fa.error;
    if (inc.error) throw inc.error;
    if (pre.error) throw pre.error;
    if (sp.error) logServerError("getSnapshot.spese (0008 non applicata?)", sp.error);
    return {
      ...base,
      dbPronto: true,
      nickname,
      clienti: (cl.data ?? []) as Snapshot["clienti"],
      fatture: (fa.data ?? []).map((f) => ({
        ...(f as Fattura),
        importo: Number(f.importo),
        bollo: Number(f.bollo),
      })),
      incassi: (inc.data ?? []).map((i) => ({
        ...(i as Incasso),
        importo: Number(i.importo),
        accantonamento_imposta: Number(i.accantonamento_imposta),
        accantonamento_inps: Number(i.accantonamento_inps),
      })),
      spese: sp.error
        ? []
        : (sp.data ?? []).map((s) => ({ ...(s as Spesa), importo: Number(s.importo) })),
      preventivi: (pre.data ?? []) as Snapshot["preventivi"],
    };
  } catch (e) {
    logServerError("getSnapshot", e);
    return base;
  }
});

// ---- Calcoli puri -------------------------------------------------------------------------

export const emessa = (f: Fattura) => f.stato === "emessa" || f.stato === "incassata";
export const totaleDoc = (f: Fattura) => r2(f.importo + f.bollo);
export const scadenzaFattura = (f: Fattura): string | null =>
  f.scadenza_pagamento ?? (f.data_emissione ? aggiungiGiorni(f.data_emissione, 30) : null);
export const nomeCliente = (s: Pick<Snapshot, "clienti">, id: string) =>
  s.clienti.find((c) => c.id === id)?.nome ?? "Cliente";
export const trimestreDi = (data: string) =>
  Math.min(4, Math.max(1, Math.ceil(Number(data.slice(5, 7)) / 3))) as 1 | 2 | 3 | 4;

export function fattureInAnno(s: Snapshot, anno: number) {
  return s.fatture.filter((f) => emessa(f) && f.data_emissione?.startsWith(`${anno}-`));
}

export function mensile(s: Snapshot, anno: number) {
  const fatturato = Array<number>(12).fill(0);
  const incassato = Array<number>(12).fill(0);
  for (const f of fattureInAnno(s, anno)) fatturato[Number(f.data_emissione!.slice(5, 7)) - 1] += f.importo;
  for (const i of s.incassi)
    if (i.data.startsWith(`${anno}-`)) incassato[Number(i.data.slice(5, 7)) - 1] += i.importo;
  return { fatturato: fatturato.map(r2), incassato: incassato.map(r2) };
}

export function kpiAnno(s: Snapshot, anno: number) {
  const fatture = fattureInAnno(s, anno);
  const fatturato = fatture.reduce((t, f) => t + f.importo, 0);
  const incassiAnno = s.incassi.filter((i) => i.data.startsWith(`${anno}-`));
  const incassato = incassiAnno.reduce((t, i) => t + i.importo, 0);
  const accantonare = incassiAnno.reduce((t, i) => t + i.accantonamento_imposta + i.accantonamento_inps, 0);
  const messo = incassiAnno
    .filter((i) => i.spostato)
    .reduce((t, i) => t + i.accantonamento_imposta + i.accantonamento_inps, 0);
  const daIncassare = s.fatture.filter((f) => f.stato === "emessa").reduce((t, f) => t + totaleDoc(f), 0);
  const speseAnno = s.spese.filter((x) => x.data.startsWith(`${anno}-`)).reduce((t, x) => t + x.importo, 0);
  const bolli = fatture.reduce((t, f) => t + f.bollo, 0);
  return {
    fatturato: r2(fatturato),
    incassato: r2(incassato),
    daIncassare: r2(daIncassare),
    accantonare: r2(accantonare),
    messo: r2(messo),
    spese: r2(speseAnno),
    bolli: r2(bolli),
    nFatture: fatture.length,
  };
}

function raggruppa(voci: { nome: string; valore: number }[], max = 6) {
  const m = new Map<string, number>();
  for (const v of voci) m.set(v.nome, (m.get(v.nome) ?? 0) + v.valore);
  const ord = [...m.entries()].map(([nome, valore]) => ({ nome, valore: r2(valore) })).sort((a, b) => b.valore - a.valore);
  if (ord.length <= max) return ord;
  const resto = ord.slice(max - 1).reduce((t, x) => t + x.valore, 0);
  return [...ord.slice(0, max - 1), { nome: "Altri", valore: r2(resto) }];
}

export function fatturatoPerCliente(s: Snapshot, anno: number) {
  return raggruppa(fattureInAnno(s, anno).map((f) => ({ nome: nomeCliente(s, f.cliente_id), valore: f.importo })));
}

export function fatturatoPerServizio(s: Snapshot, anno: number) {
  const voci: { nome: string; valore: number }[] = [];
  for (const f of fattureInAnno(s, anno)) {
    if (f.righe && f.righe.length > 0)
      for (const r of f.righe) voci.push({ nome: r.descrizione, valore: r.quantita * r.prezzo });
    else voci.push({ nome: f.descrizione || "Altro", valore: f.importo });
  }
  return raggruppa(voci);
}

export function spesePerCategoria(s: Snapshot, anno: number) {
  return raggruppa(
    s.spese
      .filter((x) => x.data.startsWith(`${anno}-`))
      .map((x) => ({ nome: x.categoria || "Senza categoria", valore: x.importo })),
  );
}

export interface RigaTrimestre {
  trimestre: 1 | 2 | 3 | 4;
  fatturato: number;
  incassato: number;
  bolli: number;
  accantonato: number;
}

export function trimestri(s: Snapshot, anno: number): RigaTrimestre[] {
  const out: RigaTrimestre[] = [1, 2, 3, 4].map((t) => ({
    trimestre: t as 1 | 2 | 3 | 4,
    fatturato: 0,
    incassato: 0,
    bolli: 0,
    accantonato: 0,
  }));
  for (const f of fattureInAnno(s, anno)) {
    const r = out[trimestreDi(f.data_emissione!) - 1];
    r.fatturato += f.importo;
    r.bolli += f.bollo;
  }
  for (const i of s.incassi) {
    if (!i.data.startsWith(`${anno}-`)) continue;
    const r = out[trimestreDi(i.data) - 1];
    r.incassato += i.importo;
    r.accantonato += i.accantonamento_imposta + i.accantonamento_inps;
  }
  return out.map((r) => ({
    ...r,
    fatturato: r2(r.fatturato),
    incassato: r2(r.incassato),
    bolli: r2(r.bolli),
    accantonato: r2(r.accantonato),
  }));
}

export function anniDisponibili(s: Snapshot): number[] {
  const set = new Set<number>([s.anno]);
  for (const f of s.fatture) if (f.data_emissione) set.add(Number(f.data_emissione.slice(0, 4)));
  for (const i of s.incassi) set.add(Number(i.data.slice(0, 4)));
  return [...set].sort((a, b) => a - b);
}
