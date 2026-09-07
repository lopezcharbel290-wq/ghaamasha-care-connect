import { useMemo, useState } from "react";
import { ArrowRight, Baby, Bone, Brain, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAgenda } from "@/components/agenda-context";
import { SectionHeading } from "@/components/section-heading";
import { CATEGORIAS, TODOS_LOS_PADECIMIENTOS } from "@/lib/clinic-data";
import { cn } from "@/lib/utils";

const ICONOS = { bone: Bone, brain: Brain, baby: Baby } as const;

export function PadecimientosExplorer({ compactHeading = false }: { compactHeading?: boolean }) {
  const [query, setQuery] = useState("");
  const { openAgenda } = useAgenda();

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return null;
    return TODOS_LOS_PADECIMIENTOS.filter((p) =>
      p.padecimiento.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [query]);

  return (
    <section id="padecimientos" className="section-pad bg-gradient-soft">
      <div className="container-page">
        {!compactHeading ? (
          <SectionHeading
            eyebrow="Encuentra tu caso"
            title="¿Qué te duele o qué necesitas recuperar?"
            description="Elige tu padecimiento y te llevamos directo al tratamiento correcto con el especialista adecuado."
          />
        ) : null}

        <div className="mx-auto mt-8 max-w-xl">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              maxLength={60}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe tu síntoma: rodilla, lumbar, parálisis facial…"
              aria-label="Buscar padecimiento"
              className="h-13 rounded-full pl-11 text-base shadow-soft"
            />
          </div>

          {resultados ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              {resultados.length === 0 ? (
                <p className="px-4 py-4 text-sm text-muted-foreground">
                  No encontramos ese término. Escríbenos y te orientamos sin costo.
                </p>
              ) : (
                resultados.map((r) => (
                  <button
                    key={r.padecimiento}
                    type="button"
                    onClick={() =>
                      openAgenda({
                        padecimiento: r.padecimiento,
                        origen: `buscador:${r.padecimiento}`,
                      })
                    }
                    className="flex w-full cursor-pointer items-center justify-between gap-3 border-b border-border px-4 py-3 text-left text-sm last:border-0 hover:bg-secondary"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{r.padecimiento}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {r.categoria}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-primary" aria-hidden />
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {CATEGORIAS.map((cat) => {
            const Icono = ICONOS[cat.icono];
            return (
              <article
                key={cat.id}
                className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-lift"
              >
                <span className="grid size-12 place-items-center rounded-lg bg-primary-soft text-primary-deep">
                  <Icono className="size-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-xl font-semibold">{cat.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {cat.descripcion}
                </p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {cat.padecimientos.map((p) => (
                    <li key={p}>
                      <button
                        type="button"
                        onClick={() =>
                          openAgenda({ padecimiento: p, origen: `tarjeta:${cat.id}:${p}` })
                        }
                        className={cn(
                          "cursor-pointer rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors",
                          "hover:border-primary hover:bg-primary-soft hover:text-primary-deep",
                        )}
                      >
                        {p}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => openAgenda({ origen: `categoria:${cat.id}` })}
                  >
                    Agendar valoración <ArrowRight aria-hidden />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
