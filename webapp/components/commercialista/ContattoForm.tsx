"use client";

import { useState, useTransition } from "react";
import { saveCommercialista } from "@/app/actions/profilo-fiscale";
import { COMMERCIALISTA_SUGGERITA } from "@/lib/email-commercialista";

interface Props {
  nome: string;
  telefono: string;
  email: string;
}

const inputCls =
  "w-full rounded-xl border border-input bg-background p-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function ContattoForm({ nome, telefono, email }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveCommercialista(formData);
      if (result.error) {
        setError(result.error);
        setSaved(false);
        return;
      }
      setError(null);
      setSaved(true);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm font-semibold text-primary">Salvato!</p>}
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Nome
        <input
          name="nome"
          type="text"
          defaultValue={nome}
          placeholder={COMMERCIALISTA_SUGGERITA.nome}
          maxLength={100}
          className={`${inputCls} font-normal`}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Telefono
        <input
          name="telefono"
          type="tel"
          defaultValue={telefono}
          placeholder={COMMERCIALISTA_SUGGERITA.telefono}
          maxLength={30}
          className={`${inputCls} font-normal`}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Email
        <input
          name="email"
          type="email"
          defaultValue={email}
          placeholder="nome@esempio.it"
          maxLength={200}
          className={`${inputCls} font-normal`}
        />
      </label>
      <p className="text-xs text-muted-foreground">
        I valori grigi sono solo un suggerimento: scrivili tu e premi Salva per confermarli.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-primary p-2 font-semibold text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Salvo..." : "Salva contatti"}
      </button>
    </form>
  );
}
