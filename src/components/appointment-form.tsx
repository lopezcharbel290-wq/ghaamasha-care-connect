import { useState } from "react";
import { CalendarCheck, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSede } from "@/components/sede-context";
import {
  SEDES,
  SEDE_LIST,
  TODOS_LOS_PADECIMIENTOS,
  waLink,
  type SedeId,
} from "@/lib/clinic-data";
import { cn } from "@/lib/utils";

const schema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "Escribe tu nombre completo")
    .max(100, "Máximo 100 caracteres"),
  telefono: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .refine((v) => /^(?:\+?52)?\d{10}$/.test(v), "Ingresa un celular de 10 dígitos"),
  sede: z.enum(["tlalnepantla", "lindavista"]),
  padecimiento_principal: z
    .string()
    .trim()
    .min(3, "Cuéntanos qué te pasa")
    .max(120, "Máximo 120 caracteres"),
  fecha_solicitada: z.string().trim().min(1, "Elige una fecha"),
  comentarios: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
});

export type AgendaPrefill = {
  sede?: SedeId | undefined;
  padecimiento?: string | undefined;
  origen?: string | undefined;
};

type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>;

export function AppointmentForm({
  prefill,
  className,
  compact = false,
}: {
  prefill?: AgendaPrefill | undefined;
  className?: string | undefined;
  compact?: boolean;
}) {
  const { sedeId } = useSede();
  const [values, setValues] = useState({
    nombre: "",
    telefono: "",
    sede: (prefill?.sede ?? sedeId) as SedeId,
    padecimiento_principal: prefill?.padecimiento ?? "",
    fecha_solicitada: "",
    comentarios: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  const sedeElegida = SEDES[values.sede];

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setStatus("sending");
    // Demo: los datos aún no se guardan. Se conectará la base de datos después.
    window.setTimeout(() => setStatus("done"), 700);
  }

  if (status === "done") {
    return (
      <div
        className={cn(
          "rounded-3xl border border-border bg-card p-7 text-center shadow-card",
          className,
        )}
      >
        <CheckCircle2 className="mx-auto size-12 text-whatsapp" aria-hidden />
        <h3 className="mt-4 text-2xl font-extrabold">¡Solicitud recibida!</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Gracias, {values.nombre.split(" ")[0]}. Te contactaremos en breve al{" "}
          <span className="font-semibold text-foreground">{values.telefono}</span> para confirmar tu
          cita en la sede <span className="font-semibold text-foreground">{sedeElegida.nombre}</span>.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="whatsapp" size="lg" asChild>
            <a
              href={waLink(
                sedeElegida,
                `Hola GHAAMASHA, soy ${values.nombre}. Acabo de solicitar una cita en ${sedeElegida.nombre} por ${values.padecimiento_principal} para el ${values.fecha_solicitada}.`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle aria-hidden /> Continuar por WhatsApp
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setValues({
                nombre: "",
                telefono: "",
                sede: values.sede,
                padecimiento_principal: "",
                fecha_solicitada: "",
                comentarios: "",
              });
              setStatus("idle");
            }}
          >
            Enviar otra solicitud
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn(
        "rounded-3xl border border-border bg-card p-6 shadow-card sm:p-7",
        className,
      )}
    >
      {!compact ? (
        <div className="mb-6">
          <h3 className="text-2xl font-extrabold">Agenda tu valoración</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Déjanos tus datos y te confirmamos horario por teléfono o WhatsApp.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre completo" error={errors.nombre} htmlFor="nombre">
          <Input
            id="nombre"
            value={values.nombre}
            maxLength={100}
            autoComplete="name"
            placeholder="Ana López Martínez"
            onChange={(e) => update("nombre", e.target.value)}
          />
        </Field>

        <Field label="Teléfono celular" error={errors.telefono} htmlFor="telefono">
          <Input
            id="telefono"
            inputMode="tel"
            maxLength={17}
            autoComplete="tel"
            placeholder="55 1234 5678"
            value={values.telefono}
            onChange={(e) => update("telefono", e.target.value)}
          />
        </Field>

        <div className="sm:col-span-2">
          <Label className="text-sm font-semibold">Sede de preferencia</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {SEDE_LIST.map((sede) => (
              <button
                key={sede.id}
                type="button"
                aria-pressed={values.sede === sede.id}
                onClick={() => update("sede", sede.id)}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left text-sm transition-colors",
                  values.sede === sede.id
                    ? "border-primary bg-primary-soft text-primary-deep"
                    : "border-border bg-background hover:bg-secondary",
                )}
              >
                <span className="block font-bold">{sede.nombre}</span>
                <span className="block text-xs text-muted-foreground">{sede.ciudad}</span>
              </button>
            ))}
          </div>
        </div>

        <Field
          label="Padecimiento principal"
          error={errors.padecimiento_principal}
          htmlFor="padecimiento"
        >
          <Input
            id="padecimiento"
            list="lista-padecimientos"
            maxLength={120}
            placeholder="Ej. dolor de rodilla"
            value={values.padecimiento_principal}
            onChange={(e) => update("padecimiento_principal", e.target.value)}
          />
          <datalist id="lista-padecimientos">
            {TODOS_LOS_PADECIMIENTOS.map((p) => (
              <option key={p.padecimiento} value={p.padecimiento} />
            ))}
          </datalist>
        </Field>

        <Field label="Fecha solicitada" error={errors.fecha_solicitada} htmlFor="fecha">
          <Input
            id="fecha"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={values.fecha_solicitada}
            onChange={(e) => update("fecha_solicitada", e.target.value)}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field
            label="Comentarios (opcional)"
            error={errors.comentarios}
            htmlFor="comentarios"
          >
            <Textarea
              id="comentarios"
              rows={3}
              maxLength={500}
              placeholder="¿Desde cuándo tienes la molestia? ¿Ya tienes estudios?"
              value={values.comentarios}
              onChange={(e) => update("comentarios", e.target.value)}
            />
          </Field>
        </div>
      </div>

      <Button
        type="submit"
        variant="cta"
        size="lg"
        className="mt-6 w-full"
        disabled={status === "sending"}
      >
        {status === "sending" ? (
          <>
            <Loader2 className="animate-spin" aria-hidden /> Enviando…
          </>
        ) : (
          <>
            <CalendarCheck aria-hidden /> Solicitar mi cita
          </>
        )}
      </Button>
      <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
        Tus datos se usan únicamente para contactarte y dar seguimiento médico. No los compartimos
        con terceros.
      </p>
      {prefill?.origen ? <input type="hidden" value={prefill.origen} readOnly /> : null}
    </form>
  );
}

function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string | undefined;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </Label>
      <div className="mt-2">{children}</div>
      {error ? <p className="mt-1.5 text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
