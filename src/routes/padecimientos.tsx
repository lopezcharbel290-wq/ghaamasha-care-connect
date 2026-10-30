import { createFileRoute } from "@tanstack/react-router";

import { PadecimientosExplorer } from "@/components/padecimientos-explorer";
import { PageHero } from "@/components/page-hero";
import { PrimeraConsulta } from "@/components/primera-consulta";

export const Route = createFileRoute("/padecimientos")({
  head: () => ({
    meta: [
      { title: "Padecimientos que tratamos | GHAAMASHA Rehabilitación" },
      {
        name: "description",
        content:
          "Dolor lumbar, cervical, rodilla, hombro, parálisis facial, EVC, Parkinson, parálisis cerebral y más. Encuentra tu padecimiento y agenda valoración.",
      },
      { property: "og:title", content: "Padecimientos que tratamos | GHAAMASHA" },
      {
        property: "og:description",
        content:
          "Ortopedia y columna, neurología y rehabilitación pediátrica en Tlalnepantla y Lindavista.",
      },
    ],
  }),
  component: PadecimientosPage,
});

function PadecimientosPage() {
  return (
    <>
      <PageHero
        eyebrow="Padecimientos"
        title="Encuentra tu padecimiento y el tratamiento indicado"
        description="Elige tu caso y agenda una valoración: el médico especialista define el plan y el número estimado de sesiones."
      />
      <PadecimientosExplorer compactHeading />
      <PrimeraConsulta />
    </>
  );
}
