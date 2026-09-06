import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { PrimeraConsulta } from "@/components/primera-consulta";
import { BLOG_POSTS } from "@/lib/clinic-data";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog de Salud y Rehabilitación | GHAAMASHA" },
      {
        name: "description",
        content:
          "Artículos de médicos especialistas sobre dolor lumbar, EVC, estimulación temprana, artrosis de rodilla y más. Aprende a cuidar tu recuperación.",
      },
      { property: "og:title", content: "Blog de Salud y Rehabilitación | GHAAMASHA" },
      {
        property: "og:description",
        content:
          "Consejos médicos y guías de rehabilitación escritos por especialistas para pacientes y familias.",
      },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Salud y rehabilitación, explicadas por especialistas"
        description="Artículos cortos y prácticos para entender tu padecimiento, saber cuándo acudir con un médico y acompañar tu recuperación en casa."
      />

      <section className="section-pad">
        <div className="container-page grid gap-6 sm:grid-cols-2">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="group flex flex-col rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
            >
              <span className="inline-flex w-fit items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-deep">
                {post.categoria}
              </span>
              <h2 className="mt-4 text-xl font-extrabold leading-snug">{post.titulo}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {post.resumen}
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" aria-hidden /> {post.fecha}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-3.5" aria-hidden /> {post.lectura} de lectura
                </span>
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                Leer artículo
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <PrimeraConsulta />
    </>
  );
}
