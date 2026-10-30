import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EstadoBadge,
  PanelCard,
  PanelError,
  PanelTitle,
  estadoClases,
} from "@/components/panel/panel-ui";
import { usePerfil } from "@/components/panel/panel-session-context";
import {
  actualizarCita,
  listarCitas,
  listarSedes,
  listarStaff,
  type Cita,
} from "@/lib/panel/panel.functions";
import { obtenerToken } from "@/lib/panel/session";

export const Route = createFileRoute("/panel-ghaamasha/_panel/")({
  head: () => ({
    meta: [
      { title: "Calendario de citas | Panel GHAAMASHA" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Calendario interno de citas de la clínica." },
    ],
  }),
  component: CalendarioPage,
});

type Vista = "dia" | "semana" | "mes";

function inicioDia(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function inicioSemana(d: Date) {
  const x = inicioDia(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function sumarDias(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function esMismoDia(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}
const fmtHora = new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" });
const fmtFechaLarga = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const fmtMes = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" });

function paraInputLocal(iso: string) {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function CalendarioPage() {
  const perfil = usePerfil();
  const queryClient = useQueryClient();
  const [vista, setVista] = useState<Vista>("semana");
  const [ancla, setAncla] = useState(() => new Date());
  const [sedeId, setSedeId] = useState("");
  const [profId, setProfId] = useState(perfil.rol === "doctor" ? perfil.id : "");
  const [seleccion, setSeleccion] = useState<Cita | null>(null);

  const rango = useMemo(() => {
    if (vista === "dia") {
      const d = inicioDia(ancla);
      return { desde: d, hasta: sumarDias(d, 1) };
    }
    if (vista === "semana") {
      const d = inicioSemana(ancla);
      return { desde: d, hasta: sumarDias(d, 7) };
    }
    const primero = new Date(ancla.getFullYear(), ancla.getMonth(), 1);
    return { desde: inicioSemana(primero), hasta: sumarDias(inicioSemana(primero), 42) };
  }, [vista, ancla]);

  const citas = useQuery({
    queryKey: ["panel", "citas", rango.desde.toISOString(), rango.hasta.toISOString(), sedeId, profId],
    queryFn: async () =>
      listarCitas({
        data: {
          token: await obtenerToken(),
          desde: rango.desde.toISOString(),
          hasta: rango.hasta.toISOString(),
          ...(sedeId ? { sedeId } : {}),
          ...(profId ? { profesionalId: profId } : {}),
        },
      }),
    refetchInterval: 60_000,
  });

  const sedes = useQuery({
    queryKey: ["panel", "sedes"],
    queryFn: async () => listarSedes({ data: { token: await obtenerToken() } }),
  });
  const staff = useQuery({
    queryKey: ["panel", "staff"],
    queryFn: async () => listarStaff({ data: { token: await obtenerToken() } }),
  });

  const lista = citas.data ?? [];
  const nombreStaff = new Map((staff.data ?? []).map((s) => [s.id, s.nombre_completo]));

  function mover(dir: number) {
    if (vista === "dia") setAncla((a) => sumarDias(a, dir));
    else if (vista === "semana") setAncla((a) => sumarDias(a, dir * 7));
    else setAncla((a) => new Date(a.getFullYear(), a.getMonth() + dir, 1));
  }

  const titulo =
    vista === "mes"
      ? fmtMes.format(ancla)
      : vista === "dia"
        ? fmtFechaLarga.format(ancla)
        : `Semana del ${inicioSemana(ancla).toLocaleDateString("es-MX")}`;

  return (
    <div className="space-y-4">
      <PanelTitle
        title="Calendario de citas"
        subtitle="Las citas con borde punteado son solicitudes del sitio web sin terapeuta ni horario real."
      />

      <PanelCard className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => mover(-1)} aria-label="Anterior">
            <ChevronLeft aria-hidden />
          </Button>
          <Button variant="outline" size="icon" onClick={() => mover(1)} aria-label="Siguiente">
            <ChevronRight aria-hidden />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAncla(new Date())}>
            Hoy
          </Button>
        </div>
        <p className="min-w-40 text-sm font-semibold capitalize text-foreground">{titulo}</p>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {(["dia", "semana", "mes"] as Vista[]).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={vista === v ? "default" : "outline"}
              onClick={() => setVista(v)}
            >
              {v === "dia" ? "Día" : v === "semana" ? "Semana" : "Mes"}
            </Button>
          ))}
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={sedeId}
            onChange={(e) => setSedeId(e.target.value)}
            aria-label="Filtrar por sede"
          >
            <option value="">Todas las sedes</option>
            {(sedes.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
          {perfil.rol !== "doctor" ? (
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={profId}
              onChange={(e) => setProfId(e.target.value)}
              aria-label="Filtrar por terapeuta"
            >
              <option value="">Todo el equipo</option>
              {(staff.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre_completo}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </PanelCard>

      {citas.isError ? (
        <PanelError mensaje="No se pudieron cargar las citas. Revisa tu sesión e inténtalo de nuevo." />
      ) : null}

      {citas.isPending ? (
        <PanelCard className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Cargando citas…
        </PanelCard>
      ) : vista === "mes" ? (
        <VistaMes desde={rango.desde} citas={lista} ancla={ancla} onSel={setSeleccion} />
      ) : (
        <VistaLista
          dias={vista === "dia" ? 1 : 7}
          desde={rango.desde}
          citas={lista}
          nombreStaff={nombreStaff}
          onSel={setSeleccion}
        />
      )}

      <DetalleCita
        cita={seleccion}
        onClose={() => setSeleccion(null)}
        staff={staff.data ?? []}
        puedeEditarTerapeuta={perfil.rol !== "doctor"}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["panel", "citas"] });
          setSeleccion(null);
        }}
      />
    </div>
  );
}

function ChipCita({ cita, onSel }: { cita: Cita; onSel: (c: Cita) => void }) {
  const sinAsignar = !cita.profesional_id;
  return (
    <button
      type="button"
      onClick={() => onSel(cita)}
      className={`w-full cursor-pointer truncate rounded-md border px-2 py-1 text-left text-xs font-semibold ${estadoClases(cita.estado)} ${sinAsignar ? "border-dashed" : ""}`}
    >
      {sinAsignar ? "⚠ " : ""}
      {fmtHora.format(new Date(cita.fecha_hora))} · {cita.pacientes?.nombre_completo ?? "Paciente"}
    </button>
  );
}

function VistaMes({
  desde,
  ancla,
  citas,
  onSel,
}: {
  desde: Date;
  ancla: Date;
  citas: Cita[];
  onSel: (c: Cita) => void;
}) {
  const dias = Array.from({ length: 42 }, (_, i) => sumarDias(desde, i));
  return (
    <PanelCard className="overflow-x-auto">
      <div className="grid min-w-[46rem] grid-cols-7 gap-1">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <p key={d} className="px-1 pb-1 text-xs font-bold uppercase text-muted-foreground">
            {d}
          </p>
        ))}
        {dias.map((d) => {
          const delDia = citas.filter((c) => esMismoDia(new Date(c.fecha_hora), d));
          const otroMes = d.getMonth() !== ancla.getMonth();
          return (
            <div
              key={d.toISOString()}
              className={`min-h-24 space-y-1 rounded-md border border-border p-1 ${otroMes ? "bg-slate-50 opacity-60" : "bg-background"}`}
            >
              <p className="text-xs font-semibold text-muted-foreground">{d.getDate()}</p>
              {delDia.slice(0, 3).map((c) => (
                <ChipCita key={c.id} cita={c} onSel={onSel} />
              ))}
              {delDia.length > 3 ? (
                <p className="text-[11px] text-muted-foreground">+{delDia.length - 3} más</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </PanelCard>
  );
}

function VistaLista({
  dias,
  desde,
  citas,
  nombreStaff,
  onSel,
}: {
  dias: number;
  desde: Date;
  citas: Cita[];
  nombreStaff: Map<string, string>;
  onSel: (c: Cita) => void;
}) {
  const fechas = Array.from({ length: dias }, (_, i) => sumarDias(desde, i));
  return (
    <div className={`grid gap-3 ${dias > 1 ? "md:grid-cols-2 xl:grid-cols-4" : ""}`}>
      {fechas.map((d) => {
        const delDia = citas.filter((c) => esMismoDia(new Date(c.fecha_hora), d));
        return (
          <PanelCard key={d.toISOString()}>
            <p className="mb-2 text-sm font-bold capitalize text-foreground">
              {d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}
            </p>
            {delDia.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin citas</p>
            ) : (
              <ul className="space-y-2">
                {delDia.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onSel(c)}
                      className={`w-full cursor-pointer rounded-lg border p-2 text-left ${estadoClases(c.estado)} ${!c.profesional_id ? "border-dashed" : ""}`}
                    >
                      <p className="flex items-center gap-1 text-sm font-bold">
                        {!c.profesional_id ? <AlertTriangle className="size-3.5" aria-hidden /> : null}
                        {fmtHora.format(new Date(c.fecha_hora))} ·{" "}
                        {c.pacientes?.nombre_completo ?? "Paciente"}
                      </p>
                      <p className="truncate text-xs opacity-80">
                        {c.sedes?.nombre ?? ""} ·{" "}
                        {c.profesional_id
                          ? (nombreStaff.get(c.profesional_id) ?? "Terapeuta")
                          : "Sin terapeuta"}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>
        );
      })}
    </div>
  );
}

function DetalleCita({
  cita,
  onClose,
  onSaved,
  staff,
  puedeEditarTerapeuta,
}: {
  cita: Cita | null;
  onClose: () => void;
  onSaved: () => void;
  staff: { id: string; nombre_completo: string; rol: string }[];
  puedeEditarTerapeuta: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  const guardar = useMutation({
    mutationFn: async (cambios: Record<string, unknown>) =>
      actualizarCita({ data: { token: await obtenerToken(), id: cita!.id, ...cambios } }),
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  });

  if (!cita) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{cita.pacientes?.nombre_completo ?? "Cita"}</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget as HTMLFormElement);
            const prof = String(fd.get("profesional_id") ?? "");
            guardar.mutate({
              fecha_hora: new Date(String(fd.get("fecha_hora"))).toISOString(),
              profesional_id: prof || null,
              estado: String(fd.get("estado")),
              numero_sesion: String(fd.get("numero_sesion")),
              notas_sesion: String(fd.get("notas_sesion") ?? ""),
            });
          }}
        >
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <EstadoBadge estado={cita.estado} />
            <span>{cita.sedes?.nombre}</span>
            {cita.pacientes?.telefono ? <span>· Tel. {cita.pacientes.telefono}</span> : null}
          </div>

          {!cita.profesional_id ? (
            <p className="rounded-lg border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Solicitud del sitio web: falta asignar horario real y terapeuta.
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="fecha_hora">Fecha y hora</Label>
            <Input
              id="fecha_hora"
              name="fecha_hora"
              type="datetime-local"
              defaultValue={paraInputLocal(cita.fecha_hora)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profesional_id">Terapeuta</Label>
            <select
              id="profesional_id"
              name="profesional_id"
              defaultValue={cita.profesional_id ?? ""}
              disabled={!puedeEditarTerapeuta}
              className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm disabled:opacity-60"
            >
              <option value="">Sin asignar</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre_completo}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="estado">Estado</Label>
              <select
                id="estado"
                name="estado"
                defaultValue={cita.estado}
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="confirmada">Confirmada</option>
                <option value="asistio">Asistió</option>
                <option value="no_asistio">No asistió</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numero_sesion">Sesión</Label>
              <Input id="numero_sesion" name="numero_sesion" defaultValue={cita.numero_sesion} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notas_sesion">Notas</Label>
            <Textarea
              id="notas_sesion"
              name="notas_sesion"
              rows={5}
              defaultValue={cita.notas_sesion ?? ""}
            />
          </div>

          {error ? <PanelError mensaje={error} /> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={guardar.isPending}>
              {guardar.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Guardar cambios
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setError(null);
                guardar.mutate({ estado: "cancelada" });
              }}
            >
              Cancelar cita
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
