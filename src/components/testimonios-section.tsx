import { Quote, Star } from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { TESTIMONIOS } from "@/lib/clinic-data";

export function TestimoniosSection() {
  return (
    <section className="section-pad bg-primary-soft/60">
      <div className="container-page">
        <SectionHeading
          eyebrow="Historias reales"
          title="Pacientes que volvieron a moverse"
          description="Cada recuperación es distinta. Estos son algunos de los avances que más nos enorgullecen."
        />

        <Carousel opts={{ align: "start", loop: true }} className="mt-10">
          <CarouselContent className="-ml-4">
            {TESTIMONIOS.map((t) => (
              <CarouselItem key={t.nombre} className="basis-full pl-4 sm:basis-1/2 lg:basis-1/3">
                <figure className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-card">
                  <Quote className="size-7 text-primary/40" aria-hidden />
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                    “{t.cita}”
                  </blockquote>
                  <div className="mt-5 flex items-center gap-1 text-accent" aria-label="5 de 5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-current" aria-hidden />
                    ))}
                  </div>
                  <figcaption className="mt-3 flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                    >
                      {t.inicial}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{t.nombre}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {t.padecimiento}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-6 flex justify-center gap-3">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
