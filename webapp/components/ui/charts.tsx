"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const MESI_BREVI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

const PALETTE = [
  "var(--pastel-azzurro)",
  "var(--pastel-menta)",
  "var(--pastel-rosa)",
  "var(--pastel-giallo)",
  "var(--pastel-lilla)",
  "var(--pastel-pesca)",
];

const euro0 = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const euro2 = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

function TooltipBox({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string | number; value?: number | string; color?: string; payload?: { fill?: string } }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs text-card-foreground shadow-md">
      {label !== undefined && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.color ?? p.payload?.fill }} />
          {p.name}: <span className="font-medium tabular-nums">{euro2.format(Number(p.value ?? 0))}</span>
        </p>
      ))}
    </div>
  );
}

export interface PuntoMensile {
  /** Etichetta del mese (es. "Gen"); vedi MESI_BREVI. */
  mese: string;
  a: number;
  b?: number;
}

interface BarMensileProps {
  /** 12 punti (uno per mese). */
  data: PuntoMensile[];
  serieA: string;
  /** Se presente, mostra una seconda serie (campo `b`). */
  serieB?: string;
  height?: number;
}

/** Barre mensili (12 mesi), 1 o 2 serie, con i colori pastello. */
export function BarMensile({ data, serieA, serieB, height = 260 }: BarMensileProps) {
  return (
    <div className="text-muted-foreground" style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.2} />
          <XAxis dataKey="mese" tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 12 }} />
          <YAxis
            width={56}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "currentColor", fontSize: 12 }}
            tickFormatter={(v) => euro0.format(Number(v))}
          />
          <Tooltip content={<TooltipBox />} cursor={{ fill: "currentColor", fillOpacity: 0.08 }} />
          {serieB && <Legend wrapperStyle={{ fontSize: 12 }} />}
          <Bar dataKey="a" name={serieA} fill="var(--pastel-azzurro)" radius={[6, 6, 0, 0]} />
          {serieB && <Bar dataKey="b" name={serieB} fill="var(--pastel-rosa)" radius={[6, 6, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface FettaTorta {
  nome: string;
  valore: number;
}

interface TortaProps {
  data: FettaTorta[];
  height?: number;
}

/** Torta per categorie, colori pastello, con legenda. */
export function Torta({ data, height = 260 }: TortaProps) {
  const dati = data.filter((d) => d.valore > 0);
  return (
    <div className="text-muted-foreground" style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={dati} dataKey="valore" nameKey="nome" innerRadius="50%" outerRadius="80%" paddingAngle={2}>
            {dati.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="var(--background, transparent)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<TooltipBox />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
