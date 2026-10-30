import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarX2, Check, Loader2, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PanelCard, PanelError, PanelTitle, PanelVacio } from "@/components/panel/panel-ui";
import { alertasChurn, type AlertaChurnPanel } from "@/lib/churn/churn.functions";
import type { Diagnostico } from "@/lib/churn/alertas";
import type { NivelRiesgo } from "@/lib/churn/types";
import { listarSedes, registrarSeguimiento } from "@/lib/panel/panel.functions";
import { obtenerToken } from "@/lib/panel/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/panel-ghaamasha/_panel/alertas")({
  head: () => ({
    meta: [
      { title: "Alertas de abandono | Panel GHAAMASHA" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Pacientes en tratamiento con riesgo de abandonar su rehabilitación.",
      },
    ],
  }),
  component: AlertasPage,
});

const NIVELES: Record<NivelRiesgo, { etiqueta: string; clases: string }> = {
  alto: { etiqueta: "Riesgo alto", clases: "bg-red-100 text-red-800 border-red-300" },
  medio: { etiqueta: "Riesgo medio", clases: "bg-amber-100 text-amber-800 border-amber-300" },
  bajo: { etiqueta: "Riesgo bajo", clases: "bg-emerald-100 text-emerald-800 border-emerald-300" },
};

type Filtro = "alto_medio" | NivelRiesgo | "todos";

function waHref(telefono: string | null, nombre: string) {
  const num = (telefono ?? "").replace(/\D/g, "").replace(/^52/, "");
  const texto = `Hola ${nombre.split(" ")[0]}, te escribimos de GHAAMASHA. Queremos saber cómo vas con tu rehabilitación y ayudarte a agendar tu siguiente sesión. ¿Cómo te sientes?`;
  return `https://wa.me/52${num}?text=${encodeURIComponent(texto)}`;
}

function AlertasPage() {
  const [sedeId, setSedeId] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("alto_medio");

  const sedes = useQuery({
    queryKey: ["panel", "sedes"],
    queryFn: async () => listarSedes({ data: { token: await obtenerToken() } }),
  });

  const alertas = useQuery({
    queryKey: ["panel", "alertas-churn", sedeId],
    staleTime: 5 * 60_000,
    queryFn: async () =>
      alertasChurn({ data: { token: await obtenerToken(), ...(sedeId ? { sedeId } : {}) } }),
  });

  const todas = alertas.data?.alertas ?? [];
  const cuenta = (n: NivelRiesgo) => todas.filter((a) => a.nivel === n).length;
  const visibles = todas.filter((a) =>
    filtro === "todos" ? true : filtro === "alto_medio" ? a.nivel !== "bajo" : a.nivel === filtro,
  );
  const nombreSede = new Map((sedes.data ?? []).map((s) => [s.id, s.nombre]));
  const modelo = alertas.data?.modelo;

  return (
    <div className="space-y-4">
      <PanelTitle
        title="Alertas de abandono"
        subtitle={`Pacientes en tratamiento con riesgo de no volver en los próximos ${modelo?.horizonte_dias ?? 30} días.`}
      />

      {modelo?.fuente_datos === "sintetico" ? (
        <PanelCard className="border-amber-300 bg-amber-50">
          <p className="flex items-start gap-2 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <strong>Modelo de prueba.</strong> Fue entrenado con datos sintéticos, no con los
              pacientes de la clínica. Las probabilidades no son confiables hasta reentrenarlo con
              datos reales.
            </span>
          </p>
        </PanelCard>
      ) : null}

      <PanelCard className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="sede">Sede</Label>
          <select
            id="sede"
            className="h-10 rounded-md border border-input bg-background px-2 text-sm"
            value={sedeId}
            onChange={(e) => setSedeId(e.target.value)}
          >
            <option value="">Todas</option>
            {(sedes.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nivel">Mostrar</Label>
          <select
            id="nivel"
            className="h-10 rounded-md border border-input bg-background px-2 text-sm"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as Filtro)}
          >
            <option value="alto_medio">Riesgo alto y medio</option>
            <option value="alto">Solo riesgo alto</option>
            <option value="medio">Solo riesgo medio</option>
            <option value="bajo">Solo riesgo bajo</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </PanelCard>

      {alertas.isError ? (
        <PanelError
          mensaje={
            alertas.error instanceof Error && alertas.error.message.startsWith("Solo ")
              ? alertas.error.message
              : "No se pudieron cargar las alertas."
          }
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        {(["alto", "medio", "bajo"] as const).map((n) => (
          <PanelCard key={n}>
            <p className="text-xs uppercase text-muted-foreground">{NIVELES[n].etiqueta}</p>
            <p className="text-2xl font-bold">{alertas.data ? cuenta(n) : "—"}</p>
          </PanelCard>
        ))}
      </div>

      {alertas.data && todas.length === 0 ? (
        <DiagnosticoVacio d={alertas.data.diagnostico} />
      ) : null}

      {alertas.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Calculando riesgo de abandono…
        </p>
      ) : alertas.data && visibles.length === 0 ? (
        <PanelVacio texto="No hay pacientes con este nivel de riesgo." />
      ) : (
        <ul className="space-y-3">
          {visibles.map((a) => (
            <AlertaFila key={a.paciente_id} alerta={a} sede={nombreSede.get(a.sede_id ?? "")} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DiagnosticoVacio({ d }: { d: Diagnostico }) {
  const lista = (o: Record<string, number>) =>
    Object.entries(o)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ") || "ninguna";
  return (
    <PanelCard className="space-y-2 text-sm">
      <p className="font-bold">¿Por qué no hay alertas?</p>
      <p className="text-muted-foreground">
        Una alerta requiere un paciente en tratamiento o en riesgo que haya asistido a una sesión en
        los últimos 60 días. Esto es lo que encontró el sistema:
      </p>
      <ul className="list-inside list-disc space-y-1">
        <li>Pacientes registrados (no archivados): {d.pacientes}</li>
        <li>
          Citas: {d.citas} ({lista(d.citasPorEstado)})
        </li>
        <li>Pacientes con al menos una cita en estado «asistió»: {d.conAsistencia}</li>
        <li>
          Con asistencia en los últimos 60 días: {d.activos} ({lista(d.activosPorJourney)})
        </li>
        <li>De ellos, en tratamiento o en riesgo: {d.puntuables}</li>
      </ul>
      <p className="text-xs text-muted-foreground">
        Si las citas están en «confirmada» y nunca pasan a «asistió», el modelo no puede ver quién
        asiste. Marca la asistencia en el calendario para que las alertas funcionen.
      </p>
    </PanelCard>
  );
}

function AlertaFila({ alerta: a, sede }: { alerta: AlertaChurnPanel; sede: string | undefined }) {
  const [contactado, setContactado] = useState(false);
  const [error, setError] = useState("");

  const marcar = useMutation({
    mutationFn: async () =>
      registrarSeguimiento({
        data: {
          token: await obtenerToken(),
          paciente_id: a.paciente_id,
          canal: "whatsapp",
          respuesta_paciente: "Contacto por alerta de abandono",
        },
      }),
    onSuccess: () => setContactado(true),
    onError: (e: Error) => setError(e.message),
  });

  const nivel = NIVELES[a.nivel];

  return (
    <li>
      <PanelCard className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold text-foreground">{a.nombre_completo}</p>
            <p className="text-xs text-muted-foreground">
              {[sede, a.telefono].filter(Boolean).join(" · ") || "Sin datos de contacto"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tabular-nums">
              {Math.round(a.probabilidad * 100)}%
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                nivel.clases,
              )}
            >
              {nivel.etiqueta}
            </span>
          </div>
        </div>

        <ul className="flex flex-wrap gap-2">
          {a.razones.map((r) => (
            <li
              key={r.columna}
              className="rounded-full border border-border bg-secondary px-3 py-1 text-xs"
            >
              {r.texto}
            </li>
          ))}
          {!a.tiene_cita_futura && !a.razones.some((r) => r.texto.includes("próxima cita")) ? (
            <li className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">
              <CalendarX2 className="size-3" aria-hidden /> Sin cita agendada
            </li>
          ) : null}
        </ul>

        {error ? <PanelError mensaje={error} /> : null}

        <div className="flex flex-wrap gap-2">
          {a.telefono ? (
            <Button asChild size="sm">
              <a href={waHref(a.telefono, a.nombre_completo)} target="_blank" rel="noreferrer">
                <MessageCircle aria-hidden /> Escribir por WhatsApp
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={contactado || marcar.isPending}
            onClick={() => {
              setError("");
              marcar.mutate();
            }}
          >
            {marcar.isPending ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Check aria-hidden />
            )}
            {contactado ? "Contacto registrado" : "Registrar contacto"}
          </Button>
        </div>
      </PanelCard>
    </li>
  );
}
