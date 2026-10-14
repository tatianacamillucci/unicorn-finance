import { describe, it, expect } from "vitest";
import { monthDateRange } from "@/lib/month-range";

describe("monthDateRange", () => {
  it("calcola correttamente un mese di 31 giorni (luglio)", () => {
    expect(monthDateRange("2026-07")).toEqual({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
    });
  });

  it("calcola correttamente un mese di 30 giorni (aprile)", () => {
    expect(monthDateRange("2026-04")).toEqual({
      startDate: "2026-04-01",
      endDate: "2026-04-30",
    });
  });

  it("calcola correttamente febbraio in un anno non bisestile", () => {
    expect(monthDateRange("2026-02")).toEqual({
      startDate: "2026-02-01",
      endDate: "2026-02-28",
    });
  });

  it("calcola correttamente febbraio in un anno bisestile", () => {
    expect(monthDateRange("2024-02")).toEqual({
      startDate: "2024-02-01",
      endDate: "2024-02-29",
    });
  });

  it("calcola correttamente dicembre (rollover di anno)", () => {
    expect(monthDateRange("2026-12")).toEqual({
      startDate: "2026-12-01",
      endDate: "2026-12-31",
    });
  });
});
