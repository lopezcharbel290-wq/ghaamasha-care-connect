import { useEffect, useState } from "react";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  BellRing,
  CalendarDays,
  CalendarPlus,
  Menu,
  Users,
  UserCog,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PANEL_BASE } from "@/lib/panel/session";
import { PanelSesionContext } from "@/components/panel/panel-session-context";
import { sesionAutomatica, type Perfil } from "@/lib/panel/panel.functions";
import { guardarSesion, leerSesion } from "@/lib/panel/session";

export const Route = createFileRoute("/panel-ghaamasha/_panel")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel interno | GHAAMASHA" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Panel interno de gestión de la clínica." },
    ],
  }),
  component: PanelLayout,
});

const SECCIONES = [
  { to: PANEL_BASE, label: "Calendario", icon: CalendarDays, exact: true, roles: ["admin", "recepcion", "doctor"] },
  { to: `${PANEL_BASE}/agendar`, label: "Agendar cita", icon: CalendarPlus, roles: ["admin", "recepcion", "doctor"] },
  { to: `${PANEL_BASE}/staff`, label: "Agenda por terapeuta", icon: UserCog, roles: ["admin", "recepcion", "doctor"] },
  { to: `${PANEL_BASE}/pacientes`, label: "Pacientes", icon: Users, roles: ["admin", "recepcion", "doctor"] },
  { to: `${PANEL_BASE}/alertas`, label: "Alertas de abandono", icon: BellRing, roles: ["admin", "recepcion"] },
  { to: `${PANEL_BASE}/estadisticas`, label: "Estadísticas", icon: BarChart3, roles: ["admin", "recepcion"] },
] as const;

function PanelLayout() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [listo, setListo] = useState(false);
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const sync = () => {
      const sesion = leerSesion();
      setPerfil(sesion?.perfil ?? null);
      setListo(true);
      if (!sesion) {
        sesionAutomatica()
          .then(guardarSesion)
          .catch(() => setError(true));
      }
    };
    sync();
    window.addEventListener("panel-sesion", sync);
    return () => window.removeEventListener("panel-sesion", sync);
  }, []);

  if (!listo || !perfil) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-muted-foreground">
        {error ? "No se pudo abrir el panel. Recarga la página." : "Cargando panel…"}
      </div>
    );
  }

  const secciones = SECCIONES.filter((s) => (s.roles as readonly string[]).includes(perfil.rol));


  return (
    <PanelSesionContext.Provider value={perfil}>
      <div className="min-h-screen bg-slate-100 lg:flex">
        <aside className="border-b border-border bg-card lg:min-h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-2 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{perfil.nombre_completo}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{perfil.rol}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Menú del panel"
              onClick={() => setMenu((v) => !v)}
            >
              <Menu aria-hidden />
            </Button>
          </div>

          <nav className={`${menu ? "block" : "hidden"} px-3 pb-4 lg:block`}>
            {secciones.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                activeOptions={{ exact: "exact" in s ? s.exact : false }}
                onClick={() => setMenu(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
              >
                <s.icon className="size-4" aria-hidden />
                {s.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </PanelSesionContext.Provider>
  );
}
