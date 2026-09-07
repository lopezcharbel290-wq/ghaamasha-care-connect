import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Base de datos externa de la clínica (Supabase administrado por el cliente).
const SUPABASE_URL = "https://tzbwmunvlmdfutjxvgqi.supabase.co";

const citaSchema = z.object({
  nombre: z.string().trim().min(3).max(150),
  telefono: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .refine((v) => /^(?:\+?52)?\d{10}$/.test(v), "Teléfono inválido")
    .transform((v) => v.replace(/^\+?52/, "")),
  sede: z.enum(["tlalnepantla", "lindavista"]),
  padecimiento_principal: z.string().trim().min(3).max(120),
  fecha_solicitada: z.string().trim().min(1),
  comentarios: z.string().trim().max(500).optional(),
  origen: z.string().trim().max(60).optional(),
});

type CitaInput = z.infer<typeof citaSchema>;

async function supabaseRest(
  path: string,
  init: RequestInit & { prefer?: string } = {},
): Promise<unknown> {
  const key = process.env["CLINIC_SUPABASE_SERVICE_ROLE_KEY"];
  if (!key) throw new Error("Falta la clave del servidor de la clínica");
  const { prefer, ...rest } = init;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...rest,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
      ...(rest.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Supabase REST error ${res.status} en ${path}: ${body}`);
    throw new Error("Error al guardar en la base de datos de la clínica");
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function buscarOCrearPaciente(data: CitaInput): Promise<string> {
  const existentes = (await supabaseRest(
    `pacientes?telefono=eq.${encodeURIComponent(data.telefono)}&select=id&limit=1`,
  )) as { id: string }[];
  if (existentes.length > 0) return existentes[0]!.id;

  const creado = (await supabaseRest("pacientes", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify({
      nombre_completo: data.nombre,
      telefono: data.telefono,
      origen: "formulario web",
      notas: `Registrado desde el sitio web. Padecimiento inicial: ${data.padecimiento_principal}`,
    }),
  })) as { id: string }[];
  if (!creado[0]?.id) throw new Error("No se pudo crear el paciente");
  return creado[0].id;
}

async function buscarSede(sede: CitaInput["sede"]): Promise<string> {
  const patron = sede === "tlalnepantla" ? "tlalnepantla" : "lindavista";
  const sedes = (await supabaseRest(
    `sedes?nombre=ilike.*${patron}*&select=id&limit=1`,
  )) as { id: string }[];
  if (!sedes[0]?.id) throw new Error(`No se encontró la sede ${sede} en la base de datos`);
  return sedes[0].id;
}

export const solicitarCita = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => citaSchema.parse(input))
  .handler(async ({ data }) => {
    const [pacienteId, sedeId] = await Promise.all([
      buscarOCrearPaciente(data),
      buscarSede(data.sede),
    ]);

    const notas = [
      `Padecimiento: ${data.padecimiento_principal}`,
      data.comentarios ? `Comentarios: ${data.comentarios}` : null,
      `Origen: formulario web${data.origen ? ` (${data.origen})` : ""}`,
    ]
      .filter(Boolean)
      .join("\n");

    await supabaseRest("citas_sesiones", {
      method: "POST",
      body: JSON.stringify({
        paciente_id: pacienteId,
        sede_id: sedeId,
        fecha_hora: `${data.fecha_solicitada}T09:00:00-06:00`,
        numero_sesion: "1ª Consulta",
        notas_sesion: notas,
      }),
    });

    return { ok: true as const };
  });
