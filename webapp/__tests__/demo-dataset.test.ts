import { describe, expect, it } from "vitest";
import { getDemoDataset } from "@/lib/demo/dataset";

describe("dataset demo", () => {
  for (const oggi of [new Date(2026, 0, 20), new Date(2026, 9, 8), new Date(2026, 11, 31)]) {
    it(`e' coerente (oggi=${oggi.toISOString().slice(0, 10)})`, () => {
      const d = getDemoDataset(oggi);
      const anno = oggi.getFullYear();
      expect(d.clienti).toHaveLength(8);
      expect(d.fatture).toHaveLength(25);
      expect(d.preventivi).toHaveLength(12);
      expect(d.spese).toHaveLength(15);
      for (const f of d.fatture.filter((x) => x.stato !== "da_emettere")) {
        expect(f.data_emissione!.startsWith(`${anno}-`)).toBe(true);
        expect(f.data_emissione! <= d.oggi).toBe(true);
      }
      expect(d.incassi).toHaveLength(d.fatture.filter((x) => x.stato === "incassata").length);
      expect(d.incassi.every((i) => i.data <= d.oggi)).toBe(true);
      expect(d.incassi.filter((i) => !i.spostato)).toHaveLength(3);
      const numeri = d.fatture.map((f) => f.numero).filter(Boolean);
      expect(new Set(numeri).size).toBe(numeri.length);
    });
  }
});
