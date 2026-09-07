import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarPlus, ChevronDown, MapPin, Menu, MessageCircle, Phone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SiteLogo } from "@/components/site-logo";
import { useSede } from "@/components/sede-context";
import { useAgenda } from "@/components/agenda-context";
import { MENSAJE_WA_DEFAULT, SEDE_LIST, waLink } from "@/lib/clinic-data";

const NAV = [
  { to: "/", label: "Inicio" },
  { to: "/nosotros", label: "Nosotros" },
  { to: "/promociones", label: "Promociones" },
  { to: "/blog", label: "Blog" },
  { to: "/convenios", label: "Convenios" },
  { to: "/contacto", label: "Contacto" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { sede, setSedeId } = useSede();
  const { openAgenda } = useAgenda();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="hidden bg-primary-deep text-primary-foreground md:block">
        <div className="container-page flex items-center justify-between gap-4 py-1.5 text-xs">
          <p className="truncate">
            Sede {sede.nombre} · {sede.horario}
          </p>
          <div className="flex shrink-0 items-center gap-4">
            <a className="flex items-center gap-1.5 hover:underline" href={`tel:${sede.telefonoLink}`}>
              <Phone className="size-3.5" aria-hidden /> {sede.telefono}
            </a>
            <a
              className="flex items-center gap-1.5 hover:underline"
              href={waLink(sede, MENSAJE_WA_DEFAULT)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="size-3.5" aria-hidden /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="container-page grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
        <Link to="/" className="min-w-0" onClick={() => setOpen(false)}>
          <SiteLogo />
        </Link>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="hidden sm:inline-flex">
                <MapPin aria-hidden /> {sede.nombre}
                <ChevronDown aria-hidden />
              </Button>
            </DropdownMenuTrigger>
             <DropdownMenuContent align="end" className="w-64 rounded-lg">
              {SEDE_LIST.map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onSelect={() => setSedeId(s.id)}
                   className="cursor-pointer flex-col items-start gap-0.5 rounded-md py-2"
                >
                  <span className="font-semibold">{s.nombre}</span>
                  <span className="text-xs text-muted-foreground">{s.telefono}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="cta"
            size="sm"
            className="hidden lg:inline-flex"
            onClick={() => openAgenda({ origen: "navbar" })}
          >
            <CalendarPlus aria-hidden /> Agendar Cita
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
          </Button>
        </div>
      </div>

      <nav className="container-page hidden items-center gap-2 pb-3 xl:flex">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary-deep data-[status=active]:text-primary-deep data-[status=active]:underline data-[status=active]:decoration-accent data-[status=active]:decoration-2 data-[status=active]:underline-offset-8"
          >
            {item.label}
          </Link>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Atención y tratamientos <ChevronDown aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-lg">
            <DropdownMenuItem asChild><Link to="/servicios">Servicios</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/padecimientos">Padecimientos</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {open ? (
        <nav className="border-t border-border bg-card xl:hidden">
          <div className="container-page flex flex-col py-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary data-[status=active]:text-primary"
              >
                {item.label}
              </Link>
            ))}
            <Link to="/servicios" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary">Servicios</Link>
            <Link to="/padecimientos" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary">Padecimientos</Link>
            <div className="mt-3 grid gap-2 sm:hidden">
              {SEDE_LIST.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSedeId(s.id);
                    setOpen(false);
                  }}
                  aria-pressed={sede.id === s.id}
                  className="rounded-xl border border-border px-3 py-2 text-left text-sm font-semibold data-[on=true]:border-primary"
                  data-on={sede.id === s.id}
                >
                  Sede {s.nombre}
                </button>
              ))}
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
