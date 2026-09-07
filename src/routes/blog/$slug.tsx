import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, CalendarPlus, Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAgenda } from "@/components/agenda-context";
import { BLOG_POSTS } from "@/lib/clinic-data";

const ARTICULOS: Record<string, { subtitulo: string; parrafos: string[] }> = {
  "dolor-lumbar-cuando-acudir": {
    subtitulo:
      "No todo dolor de espalda se resuelve con reposo. Estas son las señales que indican que necesitas valoración médica.",
    parrafos: [
      "El dolor lumbar es una de las causas más frecuentes de consulta en rehabilitación. La mayoría de los episodios mejoran en dos a seis semanas con movimiento dosificado, pero hay señales de alarma que no deben ignorarse: dolor que baja por la pierna con hormigueo o debilidad, pérdida de control de esfínteres, dolor nocturno que despierta, fiebre sin otra causa o dolor después de un traumatismo importante.",
      "Contrario a lo que muchos creen, el reposo prolongado suele empeorar el cuadro. El músculo se debilita, la articulación se pone rígida y el dolor se vuelve más difícil de tratar. La recomendación actual es mantenerse activo dentro de la tolerancia y buscar una valoración si el dolor no cede en los primeros días.",
      "En la consulta de rehabilitación, el médico realiza una exploración física completa y define si necesitas estudios de imagen. No todos los pacientes requieren resonancia: en muchos casos la exploración clínica es suficiente para orientar el diagnóstico y comenzar el tratamiento.",
      "Si el dolor lumbar lleva más de cuatro semanas, si se repite con frecuencia o si limita tus actividades diarias, no esperes más. Una valoración a tiempo evita que un problema agudo se convierta en dolor crónico.",
    ],
  },
  "rehabilitacion-despues-de-un-evc": {
    subtitulo:
      "Los primeros seis meses después de un evento cerebrovascular son la ventana más importante para recuperar función. Así se organiza un plan por etapas.",
    parrafos: [
      "Después de un evento cerebrovascular (EVC), el cerebro tiene una capacidad extraordinaria de reorganizarse llamada neuroplasticidad. Esta capacidad es mayor durante los primeros seis meses, por lo que iniciar la rehabilitación lo antes posible —una vez que el paciente está estable— marca la diferencia en el pronóstico.",
      "El plan de rehabilitación se organiza por etapas. La primera se enfoca en prevenir complicaciones: escaras, contracturas y neumonía. La segunda trabaja movilidad, equilibrio y las actividades básicas de la vida diaria. La tercera busca integrar al paciente a su vida social y, si es posible, laboral.",
      "La familia es parte esencial del tratamiento. En cada etapa le explicamos qué puede esperar, cómo ayudar sin sobreproteger y qué ejercicios hacer en casa. Un paciente acompañado y estimulado entre sesiones avanza mucho más que uno que solo recibe terapia en la clínica.",
      "Cada caso es distinto: el tipo de lesión, la edad, las enfermedades previas y la motivación influyen en la recuperación. Por eso el plan se ajusta sesión a sesión, con metas concretas y medibles que compartimos con el paciente y su familia.",
    ],
  },
  "estimulacion-temprana-en-casa": {
    subtitulo:
      "Entre sesiones de terapia, la casa es el mejor lugar para acompañar el neurodesarrollo. Estos ejercicios sencillos son seguros para hacer con tu bebé.",
    parrafos: [
      "La estimulación temprana aprovecha la plasticidad del cerebro infantil para favorecer el desarrollo motor, cognitivo y del lenguaje. No sustituye la terapia profesional, pero la potencia: lo que el niño practica en casa todos los días consolida lo aprendido en la consulta.",
      "De 0 a 6 meses: tiempo boca abajo supervisado (tummy time) varias veces al día, perseguir objetos con la mirada y jugar con sonidos. De 6 a 12 meses: favorecer el gateo con juguetes fuera de su alcance, sentarse sin apoyo con cojines de seguridad y manipular objetos de distintas texturas.",
      "De 1 a 3 años: caminar sobre superficies distintas (pasto, arena, colchoneta), apilar bloques, meter y sacar objetos de contenedores y nombrar las cosas mientras juegan. Lo importante es que la actividad sea juego, no obligación.",
      "Antes de iniciar cualquier rutina, la valoración pediátrica define qué áreas necesitan más estímulo. Si notas que tu hijo no alcanza los hitos del desarrollo para su edad —no se sienta, no camina, no dice palabras— acude a valoración: cuanto antes inicie la intervención, mejores resultados.",
    ],
  },
  "artrosis-de-rodilla-opciones": {
    subtitulo:
      "La cirugía de rodilla no es la primera opción. Estas son las alternativas con evidencia que pueden aliviar el dolor y retrasar el desgaste.",
    parrafos: [
      "La artrosis de rodilla es el desgaste progresivo del cartílago articular. Aunque no se cura, el dolor y la limitación se pueden controlar durante años con un tratamiento adecuado, y la cirugía de reemplazo articular se reserva para los casos avanzados que no responden a otras medidas.",
      "La primera línea de tratamiento combina fortalecimiento muscular —especialmente del cuádriceps—, control de peso y educación sobre la actividad física. Cada kilo que se pierde reduce varias veces esa carga sobre la rodilla al caminar. El ejercicio dosificado no empeora la artrosis; al contrario, protege la articulación.",
      "Cuando el dolor persiste, la viscosuplementación con ácido hialurónico mejora la lubricación de la articulación y puede aliviar el dolor durante meses. Es un procedimiento ambulatorio, con poca molestia, y forma parte del plan médico, no de una moda.",
      "La clave es no esperar a que el dolor sea incapacitante. Una valoración en etapas tempranas o moderadas de la artrosis abre muchas más opciones de tratamiento y mejores resultados a largo plazo.",
    ],
  },
};

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const post = BLOG_POSTS.find((p) => p.slug === params.slug);
    if (!post) {
      return { meta: [{ title: "Artículo no encontrado | GHAAMASHA" }] };
    }
    return {
      meta: [
        { title: `${post.titulo} | Blog GHAAMASHA` },
        { name: "description", content: post.resumen },
        { property: "og:title", content: post.titulo },
        { property: "og:description", content: post.resumen },
      ],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { openAgenda } = useAgenda();
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  const articulo = slug ? ARTICULOS[slug] : undefined;

  if (!post || !articulo) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <>
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="container-page py-12 md:py-16">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-foreground/85 hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden /> Volver al blog
          </Link>
          <span className="mt-5 inline-flex w-fit items-center rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]">
            {post.categoria}
          </span>
           <h1 className="mt-3 max-w-3xl text-3xl font-semibold sm:text-4xl">{post.titulo}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/85">
            {articulo.subtitulo}
          </p>
          <div className="mt-5 flex items-center gap-4 text-xs text-primary-foreground/75">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden /> {post.fecha}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5" aria-hidden /> {post.lectura} de lectura
            </span>
          </div>
        </div>
      </section>

      <article className="section-pad">
        <div className="container-page max-w-3xl">
          {articulo.parrafos.map((parrafo) => (
            <p key={parrafo.slice(0, 40)} className="mb-5 text-base leading-relaxed text-foreground">
              {parrafo}
            </p>
          ))}

          <div className="mt-10 rounded-lg border border-border bg-card p-6 shadow-card">
            <h2 className="text-xl font-semibold">¿Tienes dudas sobre tu caso?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Cada paciente es distinto. Una valoración con médico especialista te da un diagnóstico
              claro y un plan de tratamiento por escrito.
            </p>
            <Button
              variant="cta"
              size="lg"
              className="mt-5"
              onClick={() => openAgenda({ origen: `blog:${post.slug}` })}
            >
              <CalendarPlus aria-hidden /> Agenda tu valoración
            </Button>
          </div>
        </div>
      </article>
    </>
  );
}
