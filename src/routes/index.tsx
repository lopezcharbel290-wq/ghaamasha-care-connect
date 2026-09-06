import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  CalendarPlus,
  HeartHandshake,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/section-heading";
import { PadecimientosExplorer } from "@/components/padecimientos-explorer";
import { PrimeraConsulta } from "@/components/primera-consulta";
import { SedesSection } from "@/components/sedes-section";
import { ServiciosGrid } from "@/components/servicios-grid";
import { TestimoniosSection } from "@/components/testimonios-section";
import { AppointmentForm } from "@/components/appointment-form";
import { useAgenda } from "@/components/agenda-context";
import { useSede } from "@/components/sede-context";
import { MENSAJE_WA_DEFAULT, waLink } from "@/lib/clinic-data";
import heroImg from "@/assets/hero-clinica.jpg";
import drImg from "@/assets/dr-aguilar.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GHAAMASHA | Rehabilitación Física, Ortopedia y Neurología en CDMX" },
      {
        name: "description",
        content:
          "Libérate del dolor con un plan de rehabilitación personalizado. Médicos especialistas y equipo completo en Tlalnepantla y Lindavista. Agenda tu valoración.",
      },
      { property: "og:title", content: "GHAAMASHA | Rehabilitación Física en CDMX y Tlalnepantla" },
      {
        property: "og:description",
        content:
          "Rehabilitación física, ortopedia, neurología y medicina física con trato humano. Dos sedes y atención el mismo día.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <Hero />
      <Confianza />
      <PadecimientosExplorer />
      <ServiciosGrid />
      <PrimeraConsulta />
      <TestimoniosSection />
      <SedesSection />
      <AgendaCTA />
    </>
  );
}

function Hero() {
  const { openAgenda } = useAgenda();
  const { sede } = useSede();

  return (
    <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
      <div className="container-page grid gap-10 py-14 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em]">
            <Sparkles className="size-3.5" aria-hidden /> Tlalnepantla · Lindavista
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-[3.4rem]">
            Vuelve a moverte libre de lesiones y dolor
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
            Médicos especialistas en medicina de rehabilitación, equipo adecuado para cada terapia y
            un plan personalizado según tu diagnóstico. Dos sucursales para atenderte cerca de casa.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="cta" size="xl" onClick={() => openAgenda({ origen: "hero" })}>
              <CalendarPlus aria-hidden /> Solicita una valoración
            </Button>
            <Button variant="onDark" size="xl" asChild>
              <a href={waLink(sede, MENSAJE_WA_DEFAULT)} target="_blank" rel="noreferrer">
                <MessageCircle aria-hidden /> Escríbenos por WhatsApp
              </a>
            </Button>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-primary-foreground/85">
            <span className="flex items-center gap-2">
              <BadgeCheck className="size-4" aria-hidden /> Valoración con médico especialista
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4" aria-hidden /> Plan y costos por escrito
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-primary-foreground/20 shadow-lift">
            <img
              src={heroImg}
              alt="Fisioterapeuta de GHAAMASHA guiando a un paciente en barras paralelas"
              width={1600}
              height={1200}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-3xl border border-primary-foreground/20 bg-primary-foreground/10 p-4 backdrop-blur">
            <img
              src={drImg}
              alt="Dr. Ricardo Emilio Aguilar Pineda, médico especialista en medicina de rehabilitación"
              width={912}
              height={1104}
              loading="lazy"
              className="size-20 shrink-0 rounded-2xl object-cover object-top"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground/70">
                Responsable médico
              </p>
              <p className="mt-1 text-base font-extrabold">Dr. Ricardo Emilio Aguilar Pineda</p>
              <p className="text-sm text-primary-foreground/85">
                Médico Cirujano · Especialidad en Medicina de Rehabilitación
              </p>
              <p className="text-xs text-primary-foreground/70">
                Cédula profesional 7654321 · Cédula de especialidad 11223344
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Confianza() {
  const items = [
    {
      icono: Stethoscope,
      titulo: "Diagnóstico médico, no solo masaje",
      texto: "Cada plan inicia con valoración clínica y, si se requiere, electrodiagnóstico.",
    },
    {
      icono: HeartHandshake,
      titulo: "Acompañamiento en cada sesión",
      texto: "Terapeutas que registran tu avance y ajustan el tratamiento contigo.",
    },
    {
      icono: ShieldCheck,
      titulo: "Equipo completo en ambas sedes",
      texto: "Mecanoterapia, hidroterapia, electroterapia y terapia ocupacional.",
    },
  ];

  return (
    <section className="border-b border-border bg-card">
      <div className="container-page grid gap-6 py-10 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.titulo} className="flex gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
              <item.icono className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="font-bold">{item.titulo}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.texto}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AgendaCTA() {
  return (
    <section id="agendar" className="section-pad bg-gradient-soft">
      <div className="container-page grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Agenda en 1 minuto"
            title="Da el primer paso hacia tu recuperación"
            description="Llena el formulario y nuestro equipo te contacta para confirmar día y hora. Si prefieres, escríbenos por WhatsApp y te atendemos al momento."
          />
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <BadgeCheck className="size-4 shrink-0 text-primary" aria-hidden /> Respuesta el mismo día
              hábil
            </li>
            <li className="flex items-center gap-2">
              <BadgeCheck className="size-4 shrink-0 text-primary" aria-hidden /> Sin costo por informes
            </li>
            <li className="flex items-center gap-2">
              <BadgeCheck className="size-4 shrink-0 text-primary" aria-hidden /> Tus datos son
              confidenciales
            </li>
          </ul>
          <Link
            to="/padecimientos"
            className="mt-7 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            Ver todos los padecimientos que tratamos <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <AppointmentForm prefill={{ origen: "seccion_agendar_home" }} />
      </div>
    </section>
  );
}
