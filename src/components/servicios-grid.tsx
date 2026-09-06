import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Baby,
  Droplet,
  Dumbbell,
  Hand,
  Ribbon,
  Syringe,
  Waves,
  Wind,
} from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { SERVICIOS } from "@/lib/clinic-data";

const ICONOS = {
  dumbbell: Dumbbell,
  activity: Activity,
  syringe: Syringe,
  droplet: Droplet,
  waves: Waves,
  wind: Wind,
  hand: Hand,
  baby: Baby,
  ribbon: Ribbon,
} as const;

export function ServiciosGrid({ withHeading = true }: { withHeading?: boolean }) {
  return (
    <section id="servicios" className="section-pad">
      <div className="container-page">
        {withHeading ? (
          <SectionHeading
            eyebrow="Tratamientos"
            title="Servicios y terapias que ofrecemos"
            description="Tecnología médica y manos expertas: cada tratamiento se indica después de una valoración clínica."
          />
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICIOS.map((servicio) => {
            const Icono = ICONOS[servicio.icono];
            return (
              <Link
                key={servicio.slug}
                to="/servicios/$slug"
                params={{ slug: servicio.slug }}
                className="group flex flex-col rounded-3xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
                  <Icono className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold leading-snug">{servicio.nombre}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {servicio.descripcion}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                  Ver detalle
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
