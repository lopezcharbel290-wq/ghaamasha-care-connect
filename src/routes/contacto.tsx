import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import { SedesSection } from "@/components/sedes-section";
import { AppointmentForm } from "@/components/appointment-form";
import { CONTACTO, SEDES, MENSAJE_WA_DEFAULT, waLink } from "@/lib/clinic-data";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto | GHAAMASHA Rehabilitación Física" },
      {
        name: "description",
        content:
          "Llama, escribe por WhatsApp o visita nuestras sedes en Tlalnepantla y Lindavista. Horario de atención y formulario para agendar tu valoración.",
      },
      { property: "og:title", content: "Contacto | GHAAMASHA" },
      {
        property: "og:description",
        content:
          "Dos sedes para atenderte cerca de casa: Tlalnepantla y Lindavista. Agenda tu valoración por teléfono, WhatsApp o formulario.",
      },
    ],
  }),
  component: ContactoPage,
});

function ContactoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="Estamos a una llamada de distancia"
        description="Elige la sede que te quede mejor y contáctanos por teléfono o WhatsApp. También puedes dejar tus datos y te llamamos para agendar."
      />

      <section className="section-pad">
        <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href={`tel:${SEDES.tlalnepantla.telefonoLink}`}
            className="rounded-3xl border border-border bg-card p-6 text-center shadow-card transition-colors hover:border-primary/40"
          >
            <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
              <Phone className="size-5" aria-hidden />
            </span>
            <h2 className="mt-4 font-extrabold">Tlalnepantla</h2>
            <p className="mt-1 text-sm text-muted-foreground">{SEDES.tlalnepantla.telefono}</p>
          </a>
          <a
            href={`tel:${SEDES.lindavista.telefonoLink}`}
            className="rounded-3xl border border-border bg-card p-6 text-center shadow-card transition-colors hover:border-primary/40"
          >
            <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
              <Phone className="size-5" aria-hidden />
            </span>
            <h2 className="mt-4 font-extrabold">Lindavista</h2>
            <p className="mt-1 text-sm text-muted-foreground">{SEDES.lindavista.telefono}</p>
          </a>
          <a
            href={waLink(SEDES.tlalnepantla, MENSAJE_WA_DEFAULT)}
            target="_blank"
            rel="noreferrer"
            className="rounded-3xl border border-border bg-card p-6 text-center shadow-card transition-colors hover:border-primary/40"
          >
            <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
              <MessageCircle className="size-5" aria-hidden />
            </span>
            <h2 className="mt-4 font-extrabold">WhatsApp</h2>
            <p className="mt-1 text-sm text-muted-foreground">Respuesta al momento</p>
          </a>
          <a
            href={`mailto:${CONTACTO.email}`}
            className="rounded-3xl border border-border bg-card p-6 text-center shadow-card transition-colors hover:border-primary/40"
          >
            <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
              <Mail className="size-5" aria-hidden />
            </span>
            <h2 className="mt-4 font-extrabold">Correo</h2>
            <p className="mt-1 break-all text-sm text-muted-foreground">{CONTACTO.email}</p>
          </a>
        </div>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-3xl font-extrabold">Déjanos tus datos</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Te contactamos el mismo día hábil para confirmar día y hora de tu valoración. Sin
              costo por informes.
            </p>
            <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-card">
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="font-semibold text-foreground">Horario de ambas sedes:</span>
                  <br />
                  {SEDES.tlalnepantla.horario}
                </span>
              </p>
            </div>
          </div>
          <AppointmentForm prefill={{ origen: "pagina_contacto" }} />
        </div>
      </section>

      <SedesSection />
    </>
  );
}
