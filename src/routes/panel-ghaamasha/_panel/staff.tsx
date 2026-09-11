import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EstadoBadge, PanelCard, PanelError, PanelTitle, PanelVacio } from "@/components/panel/panel-ui";
import { usePerfil } from "@/components/panel/panel-session-context";
import {
  crearStaff,
  desactivarStaff,
  listarCitas,
  listarSedes,
  listarStaff,
} from "@/lib/panel/panel.functions";
import { obtenerToken } from "@/lib/panel/session";

export const Route = createFileRoute("/panel-ghaamasha/_panel/staff")({
  head: () => ({
    meta: [
      { title: "Agenda por terapeuta | Panel GHAAMASHA" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Ocupación y agenda de cada miembro del equipo." },
    ],
  }),
  component: StaffPage,
});

const fmtHora = new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" });

function inicioSemana(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

function StaffPage() {
  const perfil = usePerfil();
  const queryClient = useQueryClient();
  const [seleccionado, setSeleccionado] = useState(perfil.rol === "doctor" ? perfil.id : "");
  const [semana, setSemana] = useState(() => inicioSemana(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const staff = useQuery({
    queryKey: ["panel", "staff"],
    queryFn: async () => listarStaff({ data: { token: await obtenerToken() } }),
  });
  const sedes = useQuery({
    queryKey: ["panel", "sedes"],
    queryFn: async () => listarSedes({ data: { token: await obtenerToken() } }),
  });

  const fin = useMemo(() => {
    const f = new Date(semana);
    f.setDate(f.getDate() + 7);
    return f;
  }, [semana]);

  const citas = useQuery({
    queryKey: ["panel", "citas", "staff", seleccionado, semana.toISOString()],
    enabled: Boolean(seleccionado),
    queryFn: async () =>
      listarCitas({
        data: {
          token: await obtenerToken(),
          desde: semana.toISOString(),
          hasta: fin.toISOString(),
          profesionalId: seleccionado,
        },
      }),
  });

  const alta = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      const fd = new FormData(form);
      await crearStaff({
        data: {
          token: await obtenerToken(),
          email: String(fd.get("email")),
          password: String(fd.get("password")),
          nombre_completo: String(fd.get("nombre_completo")),
          rol: String(fd.get("rol")) as "admin" | "recepcion" | "doctor",
          sede_id: String(fd.get("sede_id") || "") || null,
        },
      });
      form.reset();
    },
    onSuccess: () => {
      setOk("Personal dado de alta correctamente.");
      queryClient.invalidateQueries({ queryKey: ["panel", "staff"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const baja = useMutation({
    mutationFn: async (id: string) => desactivarStaff({ data: { token: await obtenerToken(), id } }),
    onSuccess: () => {
      setOk("Usuario desactivado. Sus citas históricas se conservan sin terapeuta.");
      queryClient.invalidateQueries({ queryKey: ["panel", "staff"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(semana);
    d.setDate(d.getDate() + i);
    return d;
  });
  const lista = citas.data ?? [];

  return (
    <div className="space-y-4">
      <PanelTitle title="Agenda por terapeuta" subtitle="Ocupación semanal y huecos disponibles." />

      <PanelCard className="flex flex-wrap items-center gap-3">
        {perfil.rol !== "doctor" ? (
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={seleccionado}
            onChange={(e) => setSeleccionado(e.target.value)}
            aria-label="Miembro del equipo"
          >
            <option value="">Selecciona a un miembro del equipo</option>
            {(staff.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre_completo} · {s.rol}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm font-semibold">{perfil.nombre_completo}</p>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSemana((s) => new Date(s.getTime() - 7 * 86400000))}
          >
            Semana anterior
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSemana(inicioSemana(new Date()))}>
            Esta semana
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSemana((s) => new Date(s.getTime() + 7 * 86400000))}
          >
            Semana siguiente
          </Button>
        </div>
      </PanelCard>

      {seleccionado ? (
        <>
          <PanelCard>
            <p className="text-sm text-muted-foreground">
              {lista.length} cita(s) esta semana ·{" "}
              {lista.filter((c) => c.estado === "confirmada").length} confirmadas
            </p>
          </PanelCard>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {dias.map((d) => {
              const delDia = lista.filter(
                (c) => new Date(c.fecha_hora).toDateString() === d.toDateString(),
              );
              return (
                <PanelCard key={d.toISOString()}>
                  <p className="mb-2 text-sm font-bold capitalize">
                    {d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                  {delDia.length === 0 ? (
                    <p className="text-xs text-emerald-700">Día libre</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {delDia.map((c) => (
                        <li key={c.id} className="rounded-lg border border-border p-2">
                          <p className="font-semibold">
                            {fmtHora.format(new Date(c.fecha_hora))} ·{" "}
                            {c.pacientes?.nombre_completo ?? "Paciente"}
                          </p>
                          <div className="mt-1">
                            <EstadoBadge estado={c.estado} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </PanelCard>
              );
            })}
          </div>
        </>
      ) : (
        <PanelVacio texto="Elige a un miembro del equipo para ver su agenda." />
      )}

      {perfil.rol === "admin" ? (
        <PanelCard className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-bold">
            <UserPlus className="size-4" aria-hidden /> Alta de personal
          </p>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              setOk(null);
              alta.mutate(e.currentTarget);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="nombre_completo">Nombre completo</Label>
              <Input id="nombre_completo" name="nombre_completo" required minLength={3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña temporal</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rol">Rol</Label>
              <select
                id="rol"
                name="rol"
                required
                defaultValue=""
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="" disabled>
                  Selecciona el rol
                </option>
                <option value="recepcion">Recepción</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sede_id">Sede (opcional)</Label>
              <select
                id="sede_id"
                name="sede_id"
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">Sin sede fija</option>
                {(sedes.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={alta.isPending}>
                {alta.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
                Dar de alta
              </Button>
            </div>
          </form>

          {error ? <PanelError mensaje={error} /> : null}
          {ok ? (
            <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {ok}
            </p>
          ) : null}

          <ul className="divide-y divide-border">
            {(staff.data ?? []).map((s) => (
              <li key={s.id} className="space-y-2 py-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span>
                    <span className="font-semibold">{s.nombre_completo}</span>{" "}
                    <span className="text-muted-foreground">· {s.rol}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setError(null);
                        setOk(null);
                        setNuevaPassword("");
                        setResetId((prev) => (prev === s.id ? null : s.id));
                      }}
                    >
                      <KeyRound className="size-4" aria-hidden /> Cambiar contraseña
                    </Button>
                    {s.id !== perfil.id ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-700"
                        onClick={() => {
                          if (window.confirm(`¿Desactivar a ${s.nombre_completo}?`)) baja.mutate(s.id);
                        }}
                      >
                        Desactivar
                      </Button>
                    ) : null}
                  </div>
                </div>

                {resetId === s.id ? (
                  <form
                    className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-muted/40 p-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setError(null);
                      setOk(null);
                      reset.mutate({ id: s.id, password: nuevaPassword, nombre: s.nombre_completo });
                    }}
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor={`pwd-${s.id}`}>Nueva contraseña</Label>
                      <Input
                        id={`pwd-${s.id}`}
                        type="text"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        value={nuevaPassword}
                        onChange={(e) => setNuevaPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                      />
                    </div>
                    <Button type="submit" size="sm" disabled={reset.isPending}>
                      {reset.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
                      Guardar
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setResetId(null)}>
                      Cancelar
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </PanelCard>
      ) : null}
    </div>
  );
}
