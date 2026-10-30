import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PanelCard, PanelError, PanelTitle } from "@/components/panel/panel-ui";
import { usePerfil } from "@/components/panel/panel-session-context";
import {
  ORIGENES,
  crearCita,
  crearPaciente,
  listarPacientes,
  listarSedes,
  listarStaff,
  type Paciente,
} from "@/lib/panel/panel.functions";
import { PANEL_BASE, obtenerToken } from "@/lib/panel/session";

export const Route = createFileRoute("/panel-ghaamasha/_panel/agendar")({
  head: () => ({
    meta: [
      { title: "Agendar cita | Panel GHAAMASHA" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Registro rápido de citas por teléfono o WhatsApp." },
    ],
  }),
  component: AgendarPage,
});

function AgendarPage() {
  const perfil = usePerfil();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [busqueda, setBusqueda] = useState("");
  const [consulta, setConsulta] = useState("");
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const sedes = useQuery({
    queryKey: ["panel", "sedes"],
    queryFn: async () => listarSedes({ data: { token: await obtenerToken() } }),
  });
  const staff = useQuery({
    queryKey: ["panel", "staff"],
    queryFn: async () => listarStaff({ data: { token: await obtenerToken() } }),
  });
  const resultados = useQuery({
    queryKey: ["panel", "buscar-paciente", consulta],
    enabled: consulta.length >= 3,
    queryFn: async () => listarPacientes({ data: { token: await obtenerToken(), q: consulta } }),
  });

  const guardar = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      const fd = new FormData(form);
      const token = await obtenerToken();
      let pacienteId = paciente?.id;

      if (!pacienteId) {
        const creado = await crearPaciente({
          data: {
            token,
            nombre_completo: String(fd.get("nombre_completo")),
            telefono: String(fd.get("telefono")),
            correo: String(fd.get("correo") ?? ""),
            origen: String(fd.get("origen")) as (typeof ORIGENES)[number],
            municipio_zona: String(fd.get("municipio_zona") ?? ""),
            estado_journey: "cita_agendada",
            acepto_aviso_privacidad: fd.get("aviso") === "on",
          },
        });
        pacienteId = creado.id;
      }

      return crearCita({
        data: {
          token,
          paciente_id: pacienteId,
          sede_id: String(fd.get("sede_id")),
          profesional_id: String(fd.get("profesional_id") || "") || null,
          fecha_hora: new Date(String(fd.get("fecha_hora"))).toISOString(),
          numero_sesion: String(fd.get("numero_sesion") || "1ª Consulta"),
          notas_sesion: String(fd.get("notas_sesion") ?? ""),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["panel", "citas"] });
      setOk(true);
      setTimeout(() => navigate({ to: PANEL_BASE }), 900);
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="space-y-4">
      <PanelTitle
        title="Agendar cita"
        subtitle="Para llamadas, WhatsApp entrantes o citas de seguimiento."
      />

      <PanelCard>
        <Label htmlFor="buscar">Buscar paciente por nombre o teléfono</Label>
        <div className="mt-1.5 flex gap-2">
          <Input
            id="buscar"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setConsulta(busqueda);
              }
            }}
            placeholder="Ej. 5512345678"
          />
          <Button type="button" variant="secondary" onClick={() => setConsulta(busqueda)}>
            <Search aria-hidden /> Buscar
          </Button>
        </div>

        {resultados.isFetching ? (
          <p className="mt-2 text-sm text-muted-foreground">Buscando…</p>
        ) : null}

        {resultados.data && consulta.length >= 3 ? (
          <ul className="mt-3 space-y-1">
            {resultados.data.slice(0, 8).map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPaciente(p);
                    setNuevo(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${paciente?.id === p.id ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <span>
                    <span className="font-semibold">{p.nombre_completo}</span>{" "}
                    <span className="text-muted-foreground">{p.telefono}</span>
                  </span>
                  {paciente?.id === p.id ? <Check className="size-4 text-primary" aria-hidden /> : null}
                </button>
              </li>
            ))}
            {resultados.data.length === 0 ? (
              <li className="text-sm text-muted-foreground">Sin resultados.</li>
            ) : null}
          </ul>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => {
            setPaciente(null);
            setNuevo(true);
          }}
        >
          Registrar paciente nuevo
        </Button>
      </PanelCard>

      {paciente || nuevo ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            guardar.mutate(e.currentTarget);
          }}
          className="space-y-4"
        >
          {nuevo ? (
            <PanelCard className="space-y-3">
              <p className="text-sm font-bold text-foreground">Datos del paciente nuevo</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre_completo">Nombre completo</Label>
                  <Input id="nombre_completo" name="nombre_completo" required minLength={3} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" name="telefono" required minLength={10} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="correo">Correo (opcional)</Label>
                  <Input id="correo" name="correo" type="email" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="municipio_zona">Municipio o zona</Label>
                  <Input id="municipio_zona" name="municipio_zona" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="origen">¿Cómo nos conoció?</Label>
                  <select
                    id="origen"
                    name="origen"
                    required
                    defaultValue=""
                    className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="" disabled>
                      Selecciona un origen
                    </option>
                    {ORIGENES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox name="aviso" /> Aceptó el aviso de privacidad
              </label>
            </PanelCard>
          ) : (
            <PanelCard>
              <p className="text-sm">
                Paciente: <span className="font-bold">{paciente?.nombre_completo}</span> ·{" "}
                {paciente?.telefono}
              </p>
            </PanelCard>
          )}

          <PanelCard className="space-y-3">
            <p className="text-sm font-bold text-foreground">Datos de la cita</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sede_id">Sede</Label>
                <select
                  id="sede_id"
                  name="sede_id"
                  required
                  className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  {(sedes.data ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profesional_id">Terapeuta</Label>
                <select
                  id="profesional_id"
                  name="profesional_id"
                  defaultValue={perfil.rol === "doctor" ? perfil.id : ""}
                  className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="">Sin asignar</option>
                  {(staff.data ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fecha_hora">Fecha y hora</Label>
                <Input id="fecha_hora" name="fecha_hora" type="datetime-local" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="numero_sesion">Sesión</Label>
                <Input id="numero_sesion" name="numero_sesion" defaultValue="1ª Consulta" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notas_sesion">Notas (padecimiento, comentarios)</Label>
              <Textarea id="notas_sesion" name="notas_sesion" rows={4} />
            </div>

            {error ? <PanelError mensaje={error} /> : null}
            {ok ? (
              <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Cita creada. Abriendo el calendario…
              </p>
            ) : null}

            <Button type="submit" disabled={guardar.isPending}>
              {guardar.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Guardar cita
            </Button>
          </PanelCard>
        </form>
      ) : null}
    </div>
  );
}
