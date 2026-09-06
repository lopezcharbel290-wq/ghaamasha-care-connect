import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  Baby,
  BadgeCheck,
  CalendarPlus,
  Droplet,
  Dumbbell,
  Hand,
  MessageCircle,
  Ribbon,
  Syringe,
  Waves,
  Wind,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import { ServiciosGrid } from "@/components/servicios-grid";
import { useAgenda } from "@/components/agenda-context";
import { useSede } from "@/components/sede-context";
import { SERVICIOS, waLink } from "@/lib/clinic-data";

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

const BENEFICIOS: Record<string, string[]> = {
  mecanoterapia: [
    "Recupera fuerza muscular con resistencia progresiva y supervisada",
    "Mejora el rango de movimiento después de cirugía o inmovilización",
    "Equipos de poleas, pesas y barras paralelas en ambas sedes",
  ],
  electrodiagnostico: [
    "Confirma el origen del dolor, el hormigueo o la debilidad",
    "Estudio realizado por médico especialista en rehabilitación",
    "Resultados con interpretación clínica el mismo día",
  ],
  "toxina-incobotulinica": [
    "Disminuye la espasticidad en pacientes neurológicos",
    "Mejora la postura y facilita la terapia física",
    "Aplicación guiada por médico especialista",
  ],
  viscosuplementacion: [
    "Reduce el dolor de rodilla y hombro por osteoartrosis",
    "Mejora la lubricación y el movimiento de la articulación",
    "Alternativa antes de considerar cirugía",
  ],
  hidroterapia: [
    "Relaja la musculatura y disminuye el dolor",
    "Mejora la circulación sin carga articular",
    "Tina de remolino vertical con temperatura controlada",
  ],
  "rehabilitacion-pulmonar": [
    "Mejora la tolerancia al esfuerzo y la capacidad respiratoria",
    "Indicada en EPOC, post-neumonía y secuelas post-COVID",
    "Entrenamiento con higiene bronquial y ejercicio dosificado",
  ],
  "terapia-ocupacional": [
    "Recupera la independencia en actividades de la vida diaria",
    "Entrenamiento de mano y coordinación fina",
    "Adaptación de tareas del hogar y del trabajo",
  ],
  "rehabilitacion-pediatrica": [
    "Estimulación temprana y neurodesarrollo con enfoque lúdico",
    "Acompañamiento y guía para la familia en cada etapa",
    "Atención en parálisis cerebral, hemiparesia y retrasos del desarrollo",
  ],
  "rehabilitacion-oncologica": [
    "Manejo de fatiga, pérdida de fuerza y linfedema",
    "Movilidad de hombro y recuperación post-cirugía",
    "Programas suaves supervisados por médico especialista",
  ],
};

export const Route = createFileRoute("/servicios/$slug")({
  head: ({ params }) => {
    const servicio = SERVICIOS.find((s) => s.slug === params.slug);
    if (!servicio) {
      return { meta: [{ title: "Servicio no encontrado | GHAAMASHA" }] };
    }
    return {
      meta: [
        { title: `${servicio.nombre} | GHAAMASHA Rehabilitación` },
        { name: "description", content: servicio.detalle },
        { property: "og:title", content: `${servicio.nombre} | GHAAMASHA` },
        { property: "og:description", content: servicio.descripcion },
      ],
    };
  },
  component: ServicioDetallePage,
});

function ServicioDetallePage() {
  const { slug } = Route.useParams();
  const { openAgenda } = useAgenda();
  const { sede } = useSede();
  const servicio = SERVICIOS.find((s) => s.slug === slug);

  if (!servicio) {
    return <Navigate to="/servicios" replace />;
  }

  const Icono = ICONOS[servicio.icono];
  const beneficios = BENEFICIOS[servicio.slug] ?? [];

  return (
    <>
      <PageHero
        eyebrow="Servicio"
        title={servicio.nombre}
        description={servicio.descripcion}
      >
        <div className="flex flex-wrap gap-3">
          <Button
            variant="cta"
            size="lg"
            onClick={() => openAgenda({ origen: `servicio:${servicio.slug}` })}
          >
            <CalendarPlus aria-hidden /> Solicitar valoración
          </Button>
          <Button variant="onDark" size="lg" asChild>
            <a
              href={waLink(
                sede,
                `Hola GHAAMASHA, me interesa el servicio de ${servicio.nombre}.`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle aria-hidden /> Preguntar por WhatsApp
            </a>
          </Button>
        </div>
      </PageHero>

      <section className="section-pad">
        <div className="container-page grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary-deep">
              <Icono className="size-7" aria-hidden />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold sm:text-3xl">
              ¿En qué consiste {servicio.nombre.toLowerCase()}?
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {servicio.detalle}
            </p>
            <ul className="mt-6 space-y-3">
              {beneficios.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-card lg:sticky lg:top-32">
            <h3 className="text-lg font-extrabold">¿Este servicio es para ti?</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              La forma de saberlo es con una valoración médica. El especialista confirma el
              diagnóstico y te dice cuántas sesiones necesitas y cuánto costará el plan completo.
            </p>
            <Button
              variant="cta"
              size="lg"
              className="mt-5 w-full"
              onClick={() => openAgenda({ origen: `servicio:${servicio.slug}` })}
            >
              <CalendarPlus aria-hidden /> Agenda tu valoración
            </Button>
            <Link
              to="/servicios"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            >
              <ArrowLeft className="size-4" aria-hidden /> Ver todos los servicios
            </Link>
          </aside>
        </div>
      </section>

      <ServiciosGrid />
    </>
  );
}
