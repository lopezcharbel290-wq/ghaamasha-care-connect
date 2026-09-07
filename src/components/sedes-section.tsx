import { CalendarPlus, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/section-heading";
import { useAgenda } from "@/components/agenda-context";
import { useSede } from "@/components/sede-context";
import { SEDE_LIST, waLink } from "@/lib/clinic-data";

export function SedesSection() {
  const { openAgenda } = useAgenda();
  const { setSedeId } = useSede();

  return (
    <section id="sedes" className="section-pad">
      <div className="container-page">
        <SectionHeading
          eyebrow="Dónde estamos"
          title="Dos sedes para atenderte cerca de casa"
          description="Elige la sucursal que te quede mejor: ambas cuentan con médico especialista y equipo completo de rehabilitación."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {SEDE_LIST.map((sede) => (
            <article
              key={sede.id}
              className="overflow-hidden rounded-lg border border-border bg-card shadow-card"
            >
              <iframe
                title={`Mapa de la sede ${sede.nombre}`}
                src={sede.mapsEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="map-muted h-48 w-full border-0"
              />
              <div className="p-6">
                <h3 className="text-2xl font-semibold">Sede {sede.nombre}</h3>
                <p className="mt-3 flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    {sede.direccion}
                    <br />
                    {sede.ciudad}
                  </span>
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="size-4 shrink-0 text-primary" aria-hidden />
                  <a className="font-semibold text-foreground hover:underline" href={`tel:${sede.telefonoLink}`}>
                    {sede.telefono}
                  </a>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{sede.horario}</p>

                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="cta"
                    onClick={() => {
                      setSedeId(sede.id);
                      openAgenda({ sede: sede.id, origen: `sede:${sede.id}` });
                    }}
                  >
                    <CalendarPlus aria-hidden /> Agendar en esta sede
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={sede.mapsLink} target="_blank" rel="noreferrer">
                      <Navigation aria-hidden /> Cómo llegar
                    </a>
                  </Button>
                  <Button variant="whatsapp" className="sm:col-span-2" asChild>
                    <a
                      href={waLink(sede, `Hola, quiero información de la sede ${sede.nombre}.`)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle aria-hidden /> WhatsApp {sede.nombre}
                    </a>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
