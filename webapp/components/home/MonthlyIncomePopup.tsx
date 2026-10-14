"use client";

import { useState } from "react";
import { markMonthlyPopupSeen } from "@/app/actions/popup";

export function MonthlyIncomePopup({
  month,
  entratePreviste,
  saldoConti,
}: {
  month: string;
  entratePreviste: number;
  saldoConti: number;
}) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  async function handleClose() {
    setVisible(false);
    await markMonthlyPopupSeen(month);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-background text-foreground p-6 flex flex-col gap-3"
      >
        <h2 className="font-black text-lg">Nuovo mese</h2>
        <p className="text-sm">
          Entrate previste questo mese:{" "}
          <strong>€ {entratePreviste.toFixed(2)}</strong>
        </p>
        <p className="text-sm">
          Saldo attuale nei tuoi conti:{" "}
          <strong>€ {saldoConti.toFixed(2)}</strong>
        </p>
        <button
          onClick={handleClose}
          className="mt-2 rounded-xl bg-primary p-2 font-bold text-primary-foreground"
        >
          Ho capito
        </button>
      </div>
    </div>
  );
}
