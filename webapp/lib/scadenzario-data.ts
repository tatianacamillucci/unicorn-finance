// Timeline unica: incassi attesi, pagamenti (spese), scadenze fiscali e bollo trimestrale.
import { scadenzeFiscali } from "@/lib/fiscale";
import {
  aggiungiGiorni,
  getSnapshot,
  giorniTra,
  nomeCliente,
  r2,
  scadenzaFattura,
  totaleDoc,
  trimestreDi,
  type Snapshot,
} from "@/lib/report-data";

export type TipoVoce = "incasso" | "pagamento" | "fisco";

export interface VoceScadenzario {
  id: string;
  data: string; // YYYY-MM-DD
  tipo: TipoVoce;
  titolo: string;
  sotto: string;
  importo: number | null; // null = da calcolare con la commercialista
  scaduta: boolean;
  href?: string;
}

export interface ScadenzarioData {
  dbPronto: boolean;
  oggi: string;
  voci: VoceScadenzario[];
  daIncassare30: number;
  daPagare30: number;
}

export function costruisciVoci(s: Snapshot): VoceScadenzario[] {
  const voci: VoceScadenzario[] = [];
  for (const f of s.fatture) {
    if (f.stato !== "emessa") continue;
    const data = scadenzaFattura(f);
    if (!data) continue;
    voci.push({
      id: `inc-${f.id}`,
      data,
      tipo: "incasso",
      titolo: `${nomeCliente(s, f.cliente_id)} deve pagarti`,
      sotto: `Fattura ${f.numero ?? ""}`.trim(),
      importo: totaleDoc(f),
      scaduta: data < s.oggi,
      href: `/fatture/${f.id}`,
    });
  }
  for (const x of s.spese) {
    if (x.pagata) continue;
    voci.push({
      id: `spe-${x.id}`,
      data: x.data,
      tipo: "pagamento",
      titolo: `Devi pagare ${x.fornitore}`,
      sotto: x.descrizione ?? x.categoria ?? "Spesa",
      importo: x.importo,
      scaduta: x.data < s.oggi,
      href: "/spese",
    });
  }
  // Scadenze fiscali: da oggi in poi (le passate non sappiamo se sono state pagate).
  const visti = new Set<string>();
  for (const y of [s.anno - 1, s.anno, s.anno + 1]) {
    for (const sc of scadenzeFiscali(y, s.annoApertura)) {
      const chiave = sc.data + sc.titolo;
      if (visti.has(chiave) || sc.data < s.oggi) continue;
      visti.add(chiave);
      const q = /^Bollo (\d)/.exec(sc.titolo);
      let importo: number | null = null;
      let sotto = sc.descrizione;
      if (q) {
        // il bollo del trimestre N si riferisce all'anno y
        const n = Number(q[1]);
        importo = r2(
          s.fatture
            .filter(
              (f) =>
                (f.stato === "emessa" || f.stato === "incassata") &&
                f.data_emissione?.startsWith(`${y}-`) &&
                trimestreDi(f.data_emissione) === n,
            )
            .reduce((t, f) => t + f.bollo, 0),
        );
        sotto = `${sc.descrizione} (da verificare con la commercialista)`;
      } else {
        sotto = `${sc.descrizione} L'importo preciso si calcola con la commercialista.`;
      }
      voci.push({ id: `fis-${chiave}`, data: sc.data, tipo: "fisco", titolo: sc.titolo, sotto, importo, scaduta: false, href: "/tasse" });
    }
  }
  return voci.sort((a, b) => a.data.localeCompare(b.data));
}

export function kpi30(voci: VoceScadenzario[], oggi: string) {
  const tra30 = aggiungiGiorni(oggi, 30);
  let inc = 0;
  let pag = 0;
  for (const v of voci) {
    if (v.data > tra30 || v.importo === null) continue;
    if (v.tipo === "incasso") inc += v.importo;
    else pag += v.importo;
  }
  return { daIncassare30: r2(inc), daPagare30: r2(pag) };
}

export async function getScadenzario(): Promise<ScadenzarioData> {
  const s = await getSnapshot();
  if (!s.dbPronto) return { dbPronto: false, oggi: s.oggi, voci: [], daIncassare30: 0, daPagare30: 0 };
  const voci = costruisciVoci(s);
  return { dbPronto: true, oggi: s.oggi, voci, ...kpi30(voci, s.oggi) };
}

export const giorniAlla = (oggi: string, data: string) => giorniTra(oggi, data);
