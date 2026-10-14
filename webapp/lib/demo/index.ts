// Dati di esempio negli STESSI formati dei loader reali.
// Uso: `if (await isDemo()) return demoXxx();` (isDemo in lib/demo/mode.ts).
import { scadenzeFiscali } from "@/lib/fiscale";
import { annoAperturaDa } from "@/lib/profilo-utils";
import type { ClienteConTotali, SchedaCliente } from "@/lib/clienti-data";
import type { PreventivoRiga, ClienteOpzione } from "@/lib/preventivi-data";
import type { FatturaRiga } from "@/lib/fatture-data";
import type { IncassiData, IncassoView } from "@/lib/incassi-data";
import type { OggiData } from "@/lib/oggi-data";
import type { BolloTrimestre, TasseData } from "@/lib/tasse-data";
import type { Fattura, Preventivo, ProfiloFiscale, Servizio, Spesa } from "@/lib/types/gestionale";
import { addDays, getDemoDataset, AZIENDA_DEMO, type ContoDemo } from "./dataset";

export { AZIENDA_DEMO, getDemoDataset };
export type { ContoDemo, DemoDataset } from "./dataset";

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function nomiClienti() {
  const d = getDemoDataset();
  return new Map(d.clienti.map((c) => [c.id, c.nome]));
}

export function demoProfiloFiscale(): ProfiloFiscale {
  return getDemoDataset().profilo;
}

export function demoClienti(): { pronto: boolean; clienti: ClienteConTotali[] } {
  const d = getDemoDataset();
  return {
    pronto: true,
    clienti: [...d.clienti]
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((c) => {
        let fatturato = 0;
        let daIncassare = 0;
        for (const f of d.fatture.filter((x) => x.cliente_id === c.id)) {
          if (f.stato === "emessa" || f.stato === "incassata") fatturato += f.importo;
          if (f.stato === "emessa") daIncassare += f.importo;
        }
        return { ...c, fatturato: r2(fatturato), daIncassare: r2(daIncassare) };
      }),
  };
}

export function demoSchedaCliente(id: string): { pronto: boolean; scheda: SchedaCliente | null } {
  const d = getDemoDataset();
  const cliente = d.clienti.find((c) => c.id === id);
  if (!cliente) return { pronto: true, scheda: null };
  const byDataDesc = <T extends { data?: string; created_at: string }>(a: T, b: T) =>
    (b.data ?? b.created_at).localeCompare(a.data ?? a.created_at);
  return {
    pronto: true,
    scheda: {
      cliente,
      preventivi: d.preventivi.filter((p) => p.cliente_id === id).sort(byDataDesc),
      fatture: d.fatture.filter((f) => f.cliente_id === id).sort(byDataDesc),
      incassi: d.incassi.filter((i) => i.cliente_id === id).sort(byDataDesc),
    },
  };
}

export function demoClientiOpzioni(): ClienteOpzione[] {
  return [...getDemoDataset().clienti]
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((c) => ({ id: c.id, nome: c.nome }));
}

export function demoPreventivi(): {
  pronto: boolean;
  preventivi: PreventivoRiga[];
  clienti: ClienteOpzione[];
} {
  const d = getDemoDataset();
  const nomi = nomiClienti();
  const conFattura = new Set(d.fatture.map((f) => f.preventivo_id).filter(Boolean));
  return {
    pronto: true,
    clienti: demoClientiOpzioni(),
    preventivi: [...d.preventivi]
      .sort((a, b) => b.data.localeCompare(a.data))
      .map((p) => ({
        ...p,
        cliente_nome: nomi.get(p.cliente_id) ?? "Cliente",
        fatturaCreata: conFattura.has(p.id),
      })),
  };
}

export function demoFatture(): { pronto: boolean; fatture: FatturaRiga[]; clienti: ClienteOpzione[] } {
  const d = getDemoDataset();
  const nomi = nomiClienti();
  return {
    pronto: true,
    clienti: demoClientiOpzioni(),
    fatture: [...d.fatture]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((f) => ({ ...f, cliente_nome: nomi.get(f.cliente_id) ?? "Cliente" })),
  };
}

/** Dettaglio documento per le pagine /fatture/[id] e /preventivi/[id] (con cliente e intestazione). */
export function demoFatturaById(id: string) {
  const d = getDemoDataset();
  const fattura: Fattura | undefined = d.fatture.find((f) => f.id === id);
  if (!fattura) return null;
  const cliente = d.clienti.find((c) => c.id === fattura.cliente_id) ?? null;
  return { fattura, cliente, profilo: d.profilo, azienda: d.azienda };
}

export function demoPreventivoById(id: string) {
  const d = getDemoDataset();
  const preventivo: Preventivo | undefined = d.preventivi.find((p) => p.id === id);
  if (!preventivo) return null;
  const cliente = d.clienti.find((c) => c.id === preventivo.cliente_id) ?? null;
  return { preventivo, cliente, profilo: d.profilo, azienda: d.azienda };
}

export function demoIncassi(): IncassiData {
  const d = getDemoDataset();
  const nomi = nomiClienti();
  const incassi: IncassoView[] = [...d.incassi]
    .sort((a, b) => b.data.localeCompare(a.data))
    .map((i) => ({
      id: i.id,
      clienteNome: nomi.get(i.cliente_id) ?? "un cliente",
      data: i.data,
      importo: i.importo,
      imposta: i.accantonamento_imposta,
      inps: i.accantonamento_inps,
      resto: r2(i.importo - i.accantonamento_imposta - i.accantonamento_inps),
      spostato: i.spostato,
    }));
  let tot = 0;
  let fatto = 0;
  for (const i of incassi) {
    tot += i.imposta + i.inps;
    if (i.spostato) fatto += i.imposta + i.inps;
  }
  const contoTasse = d.conti.find((c) => c.ruolo === "tasse");
  return {
    dbPronto: true,
    incassi,
    contoTasse: contoTasse ? { id: contoTasse.id, nome: contoTasse.nome } : null,
    clienti: demoClientiOpzioni(),
    daMettereDaParte: r2(tot),
    messoDaParte: r2(fatto),
  };
}

export function demoOggi(): OggiData {
  const d = getDemoDataset();
  const annoApertura = annoAperturaDa(d.profilo);
  const quattordiciFa = addDays(d.oggi, -14);
  const tra30 = addDays(d.oggi, 30);
  const prossima =
    [...scadenzeFiscali(d.anno, annoApertura), ...scadenzeFiscali(d.anno + 1, annoApertura)]
      .filter((s) => s.data >= d.oggi && s.data <= tra30)
      .sort((a, b) => a.data.localeCompare(b.data))[0] ?? null;
  const giorni = prossima
    ? Math.round((new Date(prossima.data).getTime() - new Date(d.oggi).getTime()) / 86400000)
    : 0;
  const incassato = d.incassi.reduce((t, i) => t + i.importo, 0);
  const messo = d.incassi
    .filter((i) => i.spostato)
    .reduce((t, i) => t + i.accantonamento_imposta + i.accantonamento_inps, 0);
  return {
    dbPronto: true,
    nickname: "Tatiana",
    incassiDaSmistare: d.incassi.filter((i) => !i.spostato).length,
    fattureDaEmettere: d.fatture.filter((f) => f.stato === "da_emettere").length,
    preventiviInAttesa: d.preventivi.filter((p) => p.stato === "inviato" && p.data <= quattordiciFa).length,
    prossimaScadenza: prossima ? { ...prossima, giorni } : null,
    incassato: r2(incassato),
    messoDaParte: r2(messo),
  };
}

export function demoTasse(anno: number): TasseData {
  const d = getDemoDataset();
  const annoApertura = annoAperturaDa(d.profilo);
  const bollo: BolloTrimestre[] = [1, 2, 3, 4].map((t) => ({
    trimestre: t as 1 | 2 | 3 | 4,
    fattureConBollo: 0,
    totale: 0,
  }));
  let incassato = 0;
  let stima = 0;
  for (const i of d.incassi) {
    if (!i.data.startsWith(`${anno}-`)) continue;
    incassato += i.importo;
    stima += i.accantonamento_imposta + i.accantonamento_inps;
  }
  for (const f of d.fatture) {
    if (f.stato === "da_emettere" || f.bollo <= 0 || !f.data_emissione) continue;
    if (!f.data_emissione.startsWith(`${anno}-`)) continue;
    const mese = Number(f.data_emissione.slice(5, 7));
    const q = Math.min(4, Math.max(1, Math.ceil(mese / 3))) - 1;
    bollo[q].fattureConBollo += 1;
    bollo[q].totale = r2(bollo[q].totale + f.bollo);
  }
  return {
    dbPronto: true,
    anno,
    annoApertura,
    incassato: r2(incassato),
    stima: r2(stima),
    scadenze: scadenzeFiscali(anno, annoApertura),
    bollo,
  };
}

// ---- Per le nuove pagine (servizi, spese, scadenzario, report, impostazioni)

export function demoServizi(): { pronto: boolean; servizi: Servizio[] } {
  return { pronto: true, servizi: getDemoDataset().servizi };
}

export function demoSpese(): { pronto: boolean; spese: Spesa[] } {
  return {
    pronto: true,
    spese: [...getDemoDataset().spese].sort((a, b) => b.data.localeCompare(a.data)),
  };
}

export function demoConti(): ContoDemo[] {
  return getDemoDataset().conti;
}

export function demoAzienda() {
  return { ...AZIENDA_DEMO };
}
