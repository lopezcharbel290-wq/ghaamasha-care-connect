import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PanelCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function PanelTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

const ESTADO_CLASES: Record<string, string> = {
  confirmada: "bg-emerald-100 text-emerald-800 border-emerald-300",
  asistio: "bg-sky-100 text-sky-800 border-sky-300",
  no_asistio: "bg-red-100 text-red-800 border-red-300",
  cancelada: "bg-slate-200 text-slate-600 border-slate-300",
};

export const ESTADO_ETIQUETA: Record<string, string> = {
  confirmada: "Confirmada",
  asistio: "Asistió",
  no_asistio: "No asistió",
  cancelada: "Cancelada",
};

export function estadoClases(estado: string) {
  return ESTADO_CLASES[estado] ?? ESTADO_CLASES["confirmada"]!;
}

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
        estadoClases(estado),
      )}
    >
      {ESTADO_ETIQUETA[estado] ?? estado}
    </span>
  );
}

export function PanelError({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
      {mensaje}
    </div>
  );
}

export function PanelVacio({ texto }: { texto: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {texto}
    </p>
  );
}
