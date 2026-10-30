import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/section-heading";
import { useAgenda } from "@/components/agenda-context";
import { PASOS_PRIMERA_CONSULTA } from "@/lib/clinic-data";
import instalaciones from "@/assets/instalaciones.jpg";

export function PrimeraConsulta() {
  const { openAgenda } = useAgenda();

  return (
    <section id="primera-consulta" className="section-pad">
      <div className="container-page grid items-center gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Antes de venir"
            title="¿Qué esperar en tu primera consulta?"
            description="Así aprovechas al máximo tu valoración inicial y sales con un plan de tratamiento claro."
          />
          <ol className="mt-8 space-y-5">
            {PASOS_PRIMERA_CONSULTA.map((paso, i) => (
              <li key={paso.titulo} className="flex gap-4">
                <span
                  aria-hidden
                   className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold">{paso.titulo}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {paso.detalle}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <Button
            variant="cta"
            size="lg"
            className="mt-8"
            onClick={() => openAgenda({ origen: "primera_consulta" })}
          >
            Agendar mi valoración <ArrowRight aria-hidden />
          </Button>
        </div>

         <div className="overflow-hidden rounded-lg border border-border shadow-lift">
          <img
            src={instalaciones}
            alt="Sala de tratamiento de GHAAMASHA con tina de hidroterapia y equipo de mecanoterapia"
            width={1400}
            height={900}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
