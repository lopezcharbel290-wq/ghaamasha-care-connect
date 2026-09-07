import { createFileRoute } from "@tanstack/react-router";
import { BadgePercent, CalendarPlus, MessageCircle, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import { useAgenda } from "@/components/agenda-context";
import { useSede } from "@/components/sede-context";
import { PROMOCIONES, waLink } from "@/lib/clinic-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/promociones")({
  head: () => ({
    meta: [
      { title: "Promociones y Paquetes | GHAAMASHA Rehabilitación" },
      {
        name: "description",
        content:
          "Valoración médica inicial en promoción, paquetes de terapia física y programas de estimulación temprana. Vigentes en Tlalnepantla y Lindavista.",
      },
      { property: "og:title", content: "Promociones y Paquetes | GHAAMASHA" },
      {
        property: "og:description",
        content:
          "Descuentos en valoración inicial y paquetes de sesiones de rehabilitación física en ambas sedes.",
      },
    ],
  }),
  component: PromocionesPage,
});

function PromocionesPage() {
  const { openAgenda } = useAgenda();
  const { sede } = useSede();

  return (
    <>
      <PageHero
        eyebrow="Promociones"
        title="Precios especiales para empezar tu recuperación"
        description="Promociones vigentes en ambas sedes. Agenda con el precio publicado mencionando la promoción al confirmar tu cita."
      />

      <section className="section-pad">
        <div className="container-page grid gap-6 md:grid-cols-3">
          {PROMOCIONES.map((promo) => (
            <article
              key={promo.titulo}
              className={cn(
                "relative flex flex-col rounded-lg border bg-card p-6 shadow-card",
                promo.destacado ? "border-primary ring-2 ring-primary/20" : "border-border",
              )}
            >
              {promo.destacado ? (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-foreground">
                  <BadgePercent className="size-3.5" aria-hidden /> Más solicitada
                </span>
              ) : null}
               <span className="grid size-11 place-items-center rounded-lg bg-accent text-accent-foreground">
                <Tag className="size-5" aria-hidden />
              </span>
               <h2 className="mt-4 text-xl font-semibold leading-snug">{promo.titulo}</h2>
              <p className="mt-3 flex items-baseline gap-2">
                 <span className="font-display text-4xl font-semibold text-primary-deep">{promo.precio}</span>
                <span className="text-base font-semibold text-muted-foreground line-through">
                  {promo.antes}
                </span>
              </p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {promo.descripcion}
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {promo.vigencia}
              </p>
              <div className="mt-5 grid gap-2">
                <Button
                  variant="cta"
                  onClick={() => openAgenda({ origen: `promo:${promo.titulo}` })}
                >
                  <CalendarPlus aria-hidden /> Quiero esta promoción
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href={waLink(
                      sede,
                      `Hola GHAAMASHA, quiero aprovechar la promoción: ${promo.titulo}.`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle aria-hidden /> Consultar por WhatsApp
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
          Precios en pesos mexicanos. Las promociones no son acumulables entre sí y se sujetan a
          disponibilidad de agenda. Al confirmar tu cita, menciona el nombre de la promoción para
          respetar el precio.
        </p>
      </section>
    </>
  );
}
