import { createFileRoute } from "@tanstack/react-router";

import { PageHero } from "@/components/page-hero";
import { ServiciosGrid } from "@/components/servicios-grid";
import { PrimeraConsulta } from "@/components/primera-consulta";

export const Route = createFileRoute("/servicios")({
  head: () => ({
    meta: [
      { title: "Servicios y Terapias | GHAAMASHA Rehabilitación Física" },
      {
        name: "description",
        content:
          "Mecanoterapia, electrodiagnóstico, hidroterapia, rehabilitación pulmonar, pediátrica y oncológica en Tlalnepantla y Lindavista. Conoce cada servicio.",
      },
      { property: "og:title", content: "Servicios y Terapias | GHAAMASHA" },
      {
        property: "og:description",
        content:
          "Nueve servicios de rehabilitación física, ortopedia y neurología con equipo especializado en dos sedes.",
      },
    ],
  }),
  component: ServiciosPage,
});

function ServiciosPage() {
  return (
    <>
      <PageHero
        eyebrow="Servicios"
        title="Tratamientos para cada etapa de tu recuperación"
        description="Del diagnóstico a la terapia: cada servicio se indica después de una valoración con médico especialista. Elige el que te interesa para ver el detalle."
      />
      <ServiciosGrid withHeading={false} />
      <PrimeraConsulta />
    </>
  );
}
