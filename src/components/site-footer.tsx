import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

import { SiteLogo } from "@/components/site-logo";
import { CONTACTO, SEDE_LIST } from "@/lib/clinic-data";

const LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/nosotros", label: "Nosotros" },
  { to: "/servicios", label: "Servicios" },
  { to: "/padecimientos", label: "Padecimientos" },
  { to: "/promociones", label: "Promociones" },
  { to: "/blog", label: "Blog" },
  { to: "/convenios", label: "Convenios" },
  { to: "/contacto", label: "Contacto" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-primary-deep pb-28 text-primary-foreground md:pb-12">
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div>
          <SiteLogo tone="onDark" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/80">
            {CONTACTO.claim} Devolvemos movimiento, fuerza y vida diaria con un plan hecho para cada
            paciente.
          </p>
          <div className="mt-5 space-y-2 text-sm">
            <a
              className="flex items-center gap-2 text-primary-foreground/85 hover:underline"
              href={`mailto:${CONTACTO.email}`}
            >
              <Mail className="size-4 shrink-0" aria-hidden /> {CONTACTO.email}
            </a>
            {SEDE_LIST.map((s) => (
              <a
                key={s.id}
                className="flex items-center gap-2 text-primary-foreground/85 hover:underline"
                href={`tel:${s.telefonoLink}`}
              >
                <Phone className="size-4 shrink-0" aria-hidden /> {s.telefono} · {s.nombre}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-primary-foreground/70">
            Nuestras sedes
          </h3>
          <ul className="mt-4 space-y-5 text-sm">
            {SEDE_LIST.map((s) => (
              <li key={s.id} className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="min-w-0">
                  <span className="block font-bold">{s.nombre}</span>
                  <span className="block text-primary-foreground/80">{s.direccion}</span>
                  <span className="block text-primary-foreground/80">{s.ciudad}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-primary-foreground/70">
            Navegación
          </h3>
          <ul className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link className="text-primary-foreground/85 hover:underline" to={l.to}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-lg bg-primary-foreground/10 p-4 text-xs leading-relaxed text-primary-foreground/80">
            <p className="font-bold text-primary-foreground">Aviso de privacidad</p>
            <p className="mt-1">
              Los datos que compartes en este sitio se utilizan únicamente para contactarte, agendar
              tu cita y dar seguimiento médico. No se comparten ni venden a terceros.
            </p>
          </div>
        </div>
      </div>

      <div className="container-page border-t border-primary-foreground/15 py-5 text-xs text-primary-foreground/70">
        © {new Date().getFullYear()} GHAAMASHA · Rehabilitación Física, Ortopedia, Neurología y
        Medicina Física.
      </div>
    </footer>
  );
}
