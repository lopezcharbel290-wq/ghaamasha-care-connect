import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PanelCard, PanelError, PanelTitle } from "@/components/panel/panel-ui";
import { estadisticasPanel, listarSedes } from "@/lib/panel/panel.functions";
import { obtenerToken } from "@/lib/panel/session";

export const Route = createFileRoute("/panel-ghaamasha/_panel/estadisticas")({
  head: () => ({
    meta: [
      { title: "Estadísticas | Panel GHAAMASHA" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Indicadores operativos de citas y pacientes." },
    ],
  }),
  component: EstadisticasPage,
});

const COLORES = ["#1e3a8a", "#f59e0b", "#0ea5e9", "#10b981", "#ef4444", "#8b5cf6"];

function haceDias(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function EstadisticasPage() {
  const [desde, setDesde] = useState(haceDias(90));
  const [hasta, setHasta] = useState(() => new Date().toISOString().slice(0, 10));
  const [sedeId, setSedeId] = useState("");

  const sedes = useQuery({
    queryKey: ["panel", "sedes"],
    queryFn: async () => listarSedes({ data: { token: await obtenerToken() } }),
  });

  const stats = useQuery({
    queryKey: ["panel", "stats", desde, hasta, sedeId],
    queryFn: async () =>
      estadisticasPanel({
        data: {
          token: await obtenerToken(),
          desde: new Date(`${desde}T00:00:00`).toISOString(),
          hasta: new Date(`${hasta}T23:59:59`).toISOString(),
          ...(sedeId ? { sedeId } : {}),
        },
      }),
  });

  const d = stats.data;
  const aDatos = (obj: Record<string, number> | undefined) =>
    Object.entries(obj ?? {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-4">
      <PanelTitle title="Estadísticas" subtitle="Indicadores operativos de la clínica." />

      <PanelCard className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="desde">Desde</Label>
          <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hasta">Hasta</Label>
          <Input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
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
      </PanelCard>

      {stats.isError ? <PanelError mensaje="No se pudieron cargar las estadísticas." /> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PanelCard>
          <p className="text-xs uppercase text-muted-foreground">Citas en el periodo</p>
          <p className="text-2xl font-bold">{d?.totalCitas ?? "—"}</p>
        </PanelCard>
        <PanelCard>
          <p className="text-xs uppercase text-muted-foreground">% de inasistencia</p>
          <p className="text-2xl font-bold">{d ? `${d.inasistencia}%` : "—"}</p>
        </PanelCard>
        <PanelCard>
          <p className="text-xs uppercase text-muted-foreground">Solicitudes sin asignar</p>
          <p className="text-2xl font-bold">{d?.sinAsignar ?? "—"}</p>
        </PanelCard>
        <PanelCard>
          <p className="text-xs uppercase text-muted-foreground">Pacientes registrados</p>
          <p className="text-2xl font-bold">{d?.totalPacientes ?? "—"}</p>
        </PanelCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <PanelCard>
          <p className="mb-3 text-sm font-bold">Citas por estado</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={aDatos(d?.porEstado)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </PanelCard>

        <PanelCard>
          <p className="mb-3 text-sm font-bold">Embudo de pacientes</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={aDatos(d?.porJourney)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} fontSize={12} />
              <YAxis type="category" dataKey="name" width={110} fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </PanelCard>

        <PanelCard>
          <p className="mb-3 text-sm font-bold">Pacientes por origen</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={aDatos(d?.porOrigen)} dataKey="value" nameKey="name" outerRadius={90} label>
                {aDatos(d?.porOrigen).map((_, i) => (
                  <Cell key={i} fill={COLORES[i % COLORES.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-muted-foreground">
            Altas por canal:{" "}
            {aDatos(d?.altasPorOrigen)
              .map((x) => `${x.name}: ${x.value}`)
              .join(" · ") || "sin datos"}
          </p>
        </PanelCard>

        <PanelCard>
          <p className="mb-3 text-sm font-bold">Tendencia semanal de citas</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={d?.tendencia ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </PanelCard>

        <PanelCard>
          <p className="mb-3 text-sm font-bold">Ocupación por terapeuta</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={aDatos(d?.porProfesional)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </PanelCard>

        <PanelCard>
          <p className="mb-3 text-sm font-bold">Citas por sede</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={aDatos(d?.porSede)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </PanelCard>
      </div>
    </div>
  );
}
