import { createFileRoute } from "@tanstack/react-router";
import { Building2, FileCheck2, GraduationCap, Handshake, Mail, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { CONTACTO, CONVENIOS } from "@/lib/clinic-data";

const ICONOS = [Building2, FileCheck2, GraduationCap, Stethoscope] as const;

export const Route = createFileRoute("/convenios")({
  head: () => ({
    meta: [
      { title: "Convenios | GHAAMASHA Rehabilitación Física" },
      {
        name: "description",
        content:
          "Convenios con empresas, aseguradoras, escuelas, clubes deportivos y médicos referentes. Atención de rehabilitación para colaboradores y pacientes referidos.",
      },
      { property: "og:title", content: "Convenios | GHAAMASHA" },
      {
        property: "og:description",
        content:
          "Trabajamos con empresas, aseguradoras y médicos referentes para dar seguimiento de rehabilitación a sus pacientes.",
      },
    ],
  }),
  component: ConveniosPage,
});

function ConveniosPage() {
  return (
    <>
      <PageHero
        eyebrow="Convenios"
        title="Atención de rehabilitación para tu organización"
        description="Colaboramos con empresas, aseguradoras, escuelas y médicos para que sus colaboradores y pacientes reciban rehabilitación con seguimiento real."
      />

      <section className="section-pad">
        <div className="container-page">
          <SectionHeading
            eyebrow="Con quiénes trabajamos"
            title="Cuatro tipos de convenio"
            description="Si tu organización necesita atención de rehabilitación confiable, escríbenos y armamos un convenio a la medida."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {CONVENIOS.map((convenio, index) => {
              const Icono = ICONOS[index] ?? Handshake;
              return (
                <article
                  key={convenio.nombre}
                   className="rounded-lg border border-border bg-card p-6 shadow-card"
                >
                   <span className="grid size-11 place-items-center rounded-lg bg-primary-soft text-primary-deep">
                    <Icono className="size-5" aria-hidden />
                  </span>
                   <h2 className="mt-4 text-xl font-semibold">{convenio.nombre}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {convenio.detalle}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-pad bg-gradient-soft">
        <div className="container-page">
          <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-7 text-center shadow-card">
            <span className="mx-auto grid size-12 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Handshake className="size-6" aria-hidden />
            </span>
            <h2 className="mt-4 text-2xl font-semibold">¿Quieres proponer un convenio?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Escríbenos con el nombre de tu organización, el número de personas a atender y el tipo
              de convenio que buscas. Te respondemos con una propuesta en menos de 48 horas.
            </p>
            <Button variant="cta" size="lg" className="mt-6" asChild>
              <a href={`mailto:${CONTACTO.email}?subject=Propuesta de convenio`}>
                <Mail aria-hidden /> Escribir a {CONTACTO.email}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
