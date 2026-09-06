import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlus, GraduationCap, HeartHandshake, ShieldCheck, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { PrimeraConsulta } from "@/components/primera-consulta";
import { useAgenda } from "@/components/agenda-context";
import drImg from "@/assets/dr-aguilar.jpg";
import instalacionesImg from "@/assets/instalaciones.jpg";

export const Route = createFileRoute("/nosotros")({
  head: () => ({
    meta: [
      { title: "Nosotros | GHAAMASHA Rehabilitación Física" },
      {
        name: "description",
        content:
          "Conoce al equipo de GHAAMASHA: médico especialista en medicina de rehabilitación, dos sedes en CDMX y Estado de México, y un trato humano en cada sesión.",
      },
      { property: "og:title", content: "Nosotros | GHAAMASHA Rehabilitación Física" },
      {
        property: "og:description",
        content:
          "Equipo médico de rehabilitación con sedes en Tlalnepantla y Lindavista. Conoce nuestra historia y al Dr. Ricardo Emilio Aguilar Pineda.",
      },
    ],
  }),
  component: NosotrosPage,
});

function NosotrosPage() {
  const { openAgenda } = useAgenda();

  return (
    <>
      <PageHero
        eyebrow="Nosotros"
        title="Una clínica de rehabilitación con trato humano"
        description="En GHAAMASHA creemos que recuperarse no es solo cuestión de ejercicios: es sentirse acompañado, entendido y seguro en cada paso del tratamiento."
      />

      <section className="section-pad">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-border shadow-card">
            <img
              src={instalacionesImg}
              alt="Instalaciones de GHAAMASHA con equipo de rehabilitación"
              width={1024}
              height={1024}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <SectionHeading
              align="left"
              eyebrow="Nuestra historia"
              title="Rehabilitación física, ortopedia y neurología desde el primer día"
              description="Nacimos con una idea sencilla: que ningún paciente tenga que elegir entre buena medicina y buen trato. Hoy atendemos en dos sedes —Tlalnepantla y Lindavista— con médico especialista, terapeutas certificados y el equipo necesario para cada etapa de la recuperación."
            />
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Stethoscope className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                Valoración médica antes de cualquier terapia: tu plan sale de un diagnóstico, no de
                una plantilla.
              </li>
              <li className="flex items-start gap-2">
                <HeartHandshake className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                Seguimiento del avance en cada sesión, con reporte claro para ti y tu familia.
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                Costos y número estimado de sesiones por escrito desde la primera consulta.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section-pad bg-gradient-soft">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Responsable médico"
              title="Dr. Ricardo Emilio Aguilar Pineda"
              description="Médico Cirujano con especialidad en Medicina de Rehabilitación. Dirige la valoración, el diagnóstico funcional y el plan de tratamiento de cada paciente en ambas sedes."
            />
            <div className="mt-6 space-y-3">
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <GraduationCap className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="block font-semibold text-foreground">
                    Cédula profesional 7654321
                  </span>
                  <span className="block">Cédula de especialidad 11223344</span>
                </span>
              </p>
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <Stethoscope className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                Especialista en rehabilitación de columnas, neurología, pediatría y
                electrodiagnóstico.
              </p>
            </div>
            <Button
              variant="cta"
              size="xl"
              className="mt-7"
              onClick={() => openAgenda({ origen: "nosotros_doctor" })}
            >
              <CalendarPlus aria-hidden /> Agenda una valoración con el Dr. Aguilar
            </Button>
          </div>
          <div className="overflow-hidden rounded-3xl border border-border shadow-card">
            <img
              src={drImg}
              alt="Dr. Ricardo Emilio Aguilar Pineda, médico especialista en medicina de rehabilitación"
              width={912}
              height={1104}
              loading="lazy"
              className="h-full w-full object-cover object-top"
            />
          </div>
        </div>
      </section>

      <PrimeraConsulta />
    </>
  );
}
