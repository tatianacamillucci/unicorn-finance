import { describe, it, expect } from "vitest";
import {
  calcolaAccantonamento,
  bolloDovuto,
  scadenzeFiscali,
  percentualeSoglia,
  PROFILO_DEFAULT,
} from "@/lib/fiscale";

describe("calcolaAccantonamento", () => {
  it("1000 € con i valori di default", () => {
    expect(calcolaAccantonamento(1000, PROFILO_DEFAULT)).toEqual({
      inps: 174.67,
      imposta: 24.77,
      totale: 199.44,
    });
  });
  it("usa il profilo di default se omesso", () => {
    expect(calcolaAccantonamento(0)).toEqual({ inps: 0, imposta: 0, totale: 0 });
  });
});

describe("bolloDovuto", () => {
  it("2 € sopra 77,47", () => {
    expect(bolloDovuto(77.48)).toBe(2);
    expect(bolloDovuto(500)).toBe(2);
  });
  it("0 a 77,47 o meno", () => {
    expect(bolloDovuto(77.47)).toBe(0);
    expect(bolloDovuto(10)).toBe(0);
  });
});

describe("scadenzeFiscali", () => {
  it("anno di apertura: solo bolli, niente saldo/acconti", () => {
    const s = scadenzeFiscali(2026, 2026);
    expect(s.map((x) => x.data)).toEqual(["2026-05-31", "2026-09-30", "2026-11-30", "2027-02-28"]);
    expect(s.every((x) => x.daVerificare)).toBe(true);
  });
  it("anni successivi: aggiunge saldo+acconto e secondo acconto", () => {
    const s = scadenzeFiscali(2027, 2026);
    expect(s.map((x) => x.data)).toEqual([
      "2027-05-31",
      "2027-06-30",
      "2027-09-30",
      "2027-11-30",
      "2027-11-30",
      "2028-02-28",
    ]);
  });
  it("anno prima dell'apertura: nessuna scadenza", () => {
    expect(scadenzeFiscali(2025, 2026)).toEqual([]);
  });
});

describe("percentualeSoglia", () => {
  it("calcola la percentuale su 85000", () => {
    expect(percentualeSoglia(42500)).toBe(50);
    expect(percentualeSoglia(0)).toBe(0);
  });
});
