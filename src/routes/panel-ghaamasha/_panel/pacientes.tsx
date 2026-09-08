import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Archive, Loader2, MessageCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  EstadoBadge,
  PanelCard,
  PanelError,
  PanelTitle,
  PanelVacio,
} from "@/components/panel/panel-ui";
import { usePerfil } from "@/components/panel/panel-session-context";
import {
  ESTADOS_JOURNEY,
  MARCA_ARCHIVADO,
  ORIGENES,
  actualizarPaciente,
  crearPaciente,
  detallePaciente,
  listarPacientes,
  registrarSeguimiento,
  type Paciente,
} from "@/lib/panel/panel.functions";
import { obtenerToken } from "@/lib/panel/session";

export const Route = createFileRoute("/panel-ghaamasha/_panel/pacientes")({
  head: () => ({
    meta: [
      { title: "Pacientes | Panel GHAAMASHA" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Expediente y seguimiento de pacientes de la clínica." },
    ],
  }),
  component: PacientesPage,
});

const fmtFecha = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function waHref(telefono: string | null, texto: string) {
  const num = (telefono ?? "").replace(/\D/g, "").replace(/^52/, "");
  return `https://wa.me/52${num}?text=${encodeURIComponent(texto)}`;
}

function PacientesPage() {
  const perfil = usePerfil();
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const [consulta, setConsulta] = useState("");
  const [estado, setEstado] = useState("");
  const [origen, setOrigen] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);

  const pacientes = useQuery({
    queryKey: ["panel", "pacientes", consulta, estado, origen],
    queryFn: async () =>
      listarPacientes({
        data: {
          token: await obtenerToken(),
          ...(consulta ? { q: consulta } : {}),
          ...(estado ? { estado: estado as (typeof ESTADOS_JOURNEY)[number] } : {}),
          ...(origen ? { origen: origen as (typeof ORIGENES)[number] } : {}),
        },
      }),
  });

  const enRiesgo = useQuery({
    queryKey: ["panel", "pacientes", "en_riesgo"],
    queryFn: async () =>
      listarPacientes({ data: { token: await obtenerToken(), estado: "en_riesgo" } }),
  });

  const lista = pacientes.data ?? [];

  return (
    <div className="space-y-4">
      <PanelTitle title="Pacientes" subtitle="Expediente, historial de citas y seguimiento." />

      {(enRiesgo.data ?? []).length > 0 ? (
        <PanelCard className="border-amber-300 bg-amber-50">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-900">
            <AlertTriangle className="size-4" aria-hidden /> Pacientes en riesgo (
            {enRiesgo.data!.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {enRiesgo.data!.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setAbierto(p.id)}
                className="cursor-pointer rounded-full border border-amber-400 bg-white px-3 py-1 text-xs font-semibold text-amber-900"
              >
                {p.nombre_completo}
              </button>
            ))}
          </div>
        </PanelCard>
      ) : null}

      <PanelCard className="flex flex-wrap items-end gap-2">
        <div className="min-w-52 flex-1 space-y-1.5">
          <Label htmlFor="q">Buscar por nombre, teléfono o folio</Label>
          <div className="flex gap-2">
            <Input
              id="q"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setConsulta(busqueda)}
            />
            <Button type="button" variant="secondary" onClick={() => setConsulta(busqueda)}>
              <Search aria-hidden />
            </Button>
          </div>
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-2 text-sm"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          aria-label="Filtrar por etapa"
        >
          <option value="">Todas las etapas</option>
          {ESTADOS_JOURNEY.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-2 text-sm"
          value={origen}
          onChange={(e) => setOrigen(e.target.value)}
          aria-label="Filtrar por origen"
        >
          <option value="">Todos los orígenes</option>
          {ORIGENES.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <Button type="button" onClick={() => setNuevo(true)}>
          Nuevo paciente
        </Button>
      </PanelCard>

      {pacientes.isError ? <PanelError mensaje="No se pudieron cargar los pacientes." /> : null}

      {pacientes.isPending ? (
        <PanelCard className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Cargando…
        </PanelCard>
      ) : lista.length === 0 ? (
        <PanelVacio texto="No hay pacientes con esos criterios." />
      ) : (
        <PanelCard className="overflow-x-auto p-0">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Folio</th>
                <th className="px-3 py-2">Paciente</th>
                <th className="px-3 py-2">Teléfono</th>
                <th className="px-3 py-2">Etapa</th>
                <th className="px-3 py-2">Origen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lista.map((p) => (
                <tr
                  key={p.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => setAbierto(p.id)}
                >
                  <td className="px-3 py-2 text-muted-foreground">{p.id_paciente_folio ?? "—"}</td>
                  <td className="px-3 py-2 font-semibold">{p.nombre_completo}</td>
                  <td className="px-3 py-2">{p.telefono}</td>
                  <td className="px-3 py-2">{p.estado_journey}</td>
                  <td className="px-3 py-2">{p.origen ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PanelCard>
      )}

      {nuevo ? (
        <FormularioPaciente
          onClose={() => setNuevo(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["panel", "pacientes"] });
            setNuevo(false);
          }}
        />
      ) : null}

      {abierto ? (
        <FichaPaciente
          id={abierto}
          puedeSeguimiento={perfil.rol !== "doctor"}
          encargadoId={perfil.id}
          onClose={() => setAbierto(null)}
          onChanged={() => queryClient.invalidateQueries({ queryKey: ["panel", "pacientes"] })}
        />
      ) : null}
    </div>
  );
}

function CamposPaciente({ p }: { p?: Paciente }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="nombre_completo">Nombre completo</Label>
        <Input
          id="nombre_completo"
          name="nombre_completo"
          required
          minLength={3}
          defaultValue={p?.nombre_completo ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" name="telefono" required minLength={10} defaultValue={p?.telefono ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="correo">Correo</Label>
        <Input id="correo" name="correo" type="email" defaultValue={p?.correo ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="municipio_zona">Municipio o zona</Label>
        <Input id="municipio_zona" name="municipio_zona" defaultValue={p?.municipio_zona ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="origen">Origen</Label>
        <select
          id="origen"
          name="origen"
          required
          defaultValue={p?.origen ?? ""}
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
      <div className="space-y-1.5">
        <Label htmlFor="estado_journey">Etapa</Label>
        <select
          id="estado_journey"
          name="estado_journey"
          defaultValue={p?.estado_journey ?? "prospecto"}
          className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
        >
          {ESTADOS_JOURNEY.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" name="notas" rows={3} defaultValue={p?.notas ?? ""} />
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <Checkbox name="aviso" defaultChecked={p?.acepto_aviso_privacidad ?? false} /> Aceptó el aviso
        de privacidad
      </label>
    </div>
  );
}

function datosDeForm(form: HTMLFormElement) {
  const fd = new FormData(form);
  return {
    nombre_completo: String(fd.get("nombre_completo")),
    telefono: String(fd.get("telefono")),
    correo: String(fd.get("correo") ?? ""),
    origen: String(fd.get("origen")) as (typeof ORIGENES)[number],
    municipio_zona: String(fd.get("municipio_zona") ?? ""),
    notas: String(fd.get("notas") ?? ""),
    estado_journey: String(fd.get("estado_journey")) as (typeof ESTADOS_JOURNEY)[number],
    acepto_aviso_privacidad: fd.get("aviso") === "on",
  };
}

function FormularioPaciente({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const crear = useMutation({
    mutationFn: async (form: HTMLFormElement) =>
      crearPaciente({ data: { token: await obtenerToken(), ...datosDeForm(form) } }),
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo paciente</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            crear.mutate(e.currentTarget);
          }}
        >
          <CamposPaciente />
          {error ? <PanelError mensaje={error} /> : null}
          <Button type="submit" disabled={crear.isPending}>
            {crear.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null} Guardar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FichaPaciente({
  id,
  onClose,
  onChanged,
  puedeSeguimiento,
  encargadoId,
}: {
  id: string;
  onClose: () => void;
  onChanged: () => void;
  puedeSeguimiento: boolean;
  encargadoId: string;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [editar, setEditar] = useState(false);

  const ficha = useQuery({
    queryKey: ["panel", "paciente", id],
    queryFn: async () => detallePaciente({ data: { token: await obtenerToken(), id } }),
  });

  const guardar = useMutation({
    mutationFn: async (form: HTMLFormElement) =>
      actualizarPaciente({ data: { token: await obtenerToken(), id, ...datosDeForm(form) } }),
    onSuccess: () => {
      setEditar(false);
      queryClient.invalidateQueries({ queryKey: ["panel", "paciente", id] });
      onChanged();
    },
    onError: (e: Error) => setError(e.message),
  });

  const archivar = useMutation({
    mutationFn: async (notas: string) =>
      actualizarPaciente({
        data: { token: await obtenerToken(), id, notas: `${MARCA_ARCHIVADO} ${notas}`.trim() },
      }),
    onSuccess: () => {
      onChanged();
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const seguimiento = useMutation({
    mutationFn: async (respuesta: string) =>
      registrarSeguimiento({
        data: {
          token: await obtenerToken(),
          paciente_id: id,
          canal: "whatsapp",
          respuesta_paciente: respuesta,
          encargado_id: encargadoId || null,
        },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["panel", "paciente", id] }),
    onError: (e: Error) => setError(e.message),
  });

  const p = ficha.data?.paciente;
  const citas = ficha.data?.citas ?? [];
  const historial = ficha.data?.historial ?? [];
  const proxima = citas
    .filter((c) => new Date(c.fecha_hora) > new Date() && c.estado === "confirmada")
    .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))[0];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{p?.nombre_completo ?? "Paciente"}</DialogTitle>
        </DialogHeader>

        {ficha.isPending ? (
          <p className="text-sm text-muted-foreground">Cargando expediente…</p>
        ) : !p ? (
          <PanelError mensaje="No se encontró el paciente." />
        ) : (
          <div className="space-y-5">
            {editar ? (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setError(null);
                  guardar.mutate(e.currentTarget);
                }}
              >
                <CamposPaciente p={p} />
                <div className="flex gap-2">
                  <Button type="submit" disabled={guardar.isPending}>
                    {guardar.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
                    Guardar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditar(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Teléfono:</span> {p.telefono ?? "—"} ·{" "}
                  <span className="text-muted-foreground">Correo:</span> {p.correo ?? "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Zona:</span> {p.municipio_zona ?? "—"} ·{" "}
                  <span className="text-muted-foreground">Origen:</span> {p.origen ?? "—"} ·{" "}
                  <span className="text-muted-foreground">Etapa:</span> {p.estado_journey}
                </p>
                <p className="whitespace-pre-line text-muted-foreground">{p.notas ?? "Sin notas"}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => setEditar(true)}>
                    Editar datos
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-700"
                    onClick={() => {
                      if (window.confirm("¿Archivar a este paciente? No se borra su historial."))
                        archivar.mutate(p.notas ?? "");
                    }}
                  >
                    <Archive aria-hidden /> Archivar
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {proxima ? (
                <a
                  href={waHref(
                    p.telefono,
                    `Hola ${p.nombre_completo}, te esperamos el ${fmtFecha.format(new Date(proxima.fecha_hora))} en la sede ${proxima.sedes?.nombre ?? ""}.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  <MessageCircle className="size-4" aria-hidden /> Recordatorio de cita
                </a>
              ) : null}
              {puedeSeguimiento ? (
                <a
                  href={waHref(
                    p.telefono,
                    `Hola ${p.nombre_completo}, notamos que no has agendado tu siguiente sesión. ¿Cómo ha evolucionado tu dolor?`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => seguimiento.mutate("Mensaje de seguimiento enviado por WhatsApp")}
                  className="inline-flex items-center gap-2 rounded-md border border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-700"
                >
                  <MessageCircle className="size-4" aria-hidden /> Seguimiento por inactividad
                </a>
              ) : null}
            </div>

            {error ? <PanelError mensaje={error} /> : null}

            <div>
              <p className="mb-2 text-sm font-bold">Historial de citas</p>
              {citas.length === 0 ? (
                <PanelVacio texto="Sin citas registradas." />
              ) : (
                <ul className="space-y-2">
                  {citas.map((c) => (
                    <li key={c.id} className="rounded-lg border border-border p-2 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{fmtFecha.format(new Date(c.fecha_hora))}</span>
                        <EstadoBadge estado={c.estado} />
                        <span className="text-muted-foreground">
                          {c.numero_sesion} · {c.sedes?.nombre}
                        </span>
                      </div>
                      {c.notas_sesion ? (
                        <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
                          {c.notas_sesion}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {puedeSeguimiento ? (
              <div>
                <p className="mb-2 text-sm font-bold">Seguimiento</p>
                {historial.length === 0 ? (
                  <PanelVacio texto="Sin contactos registrados." />
                ) : (
                  <ul className="space-y-2">
                    {historial.map((h) => (
                      <li key={h.id} className="rounded-lg border border-border p-2 text-sm">
                        <p className="font-semibold">
                          {fmtFecha.format(new Date(h.fecha_contacto))} · {h.canal ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">{h.respuesta_paciente ?? ""}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
