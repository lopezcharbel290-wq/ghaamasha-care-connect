import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import modeloJson from "./modelo-churn.json";
import { diagnosticar, puntuarPacientes, type Diagnostico } from "./alertas";
import { aplicarRetiros } from "./retiros";
import {
  CANAL_RETIRO_ALERTA,
  type AlertaChurn,
  type CitaEntrada,
  type ModeloExportado,
  type PacienteEntrada,
  type SeguimientoEntrada,
} from "./types";

/**
 * Alertas de churn para el dashboard. Lee con el token del usuario (Supabase Auth + RLS),
 * igual que el resto del panel, y puntúa en el servidor con el modelo exportado desde
 * ml/churn (sin Python en producción).
 */
const SUPABASE_URL = "https://tzbwmunvlmdfutjxvgqi.supabase.co";
const PAGINA = 1000;
const MODELO = modeloJson as unknown as ModeloExportado;

function anonKey(): string {
  const k = process.env["CLINIC_SUPABASE_ANON_KEY"];
  if (!k) throw new Error("Falta la clave pública de la clínica");
  return k;
}

async function pedir(token: string, ruta: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${SUPABASE_URL}${ruta}`, {
    headers: { apikey: anonKey(), Authorization: `Bearer ${token}`, ...headers },
  });
  if (res.status === 401) throw new Error("SESION_EXPIRADA");
  if (!res.ok) {
    console.error(`Churn REST ${res.status} en ${ruta}: ${await res.text()}`);
    throw new Error("No se pudo consultar la base de datos de la clínica");
  }
  return res.json() as Promise<unknown>;
}

/** PostgREST limita las respuestas (normalmente 1000 filas): se pagina con Range. */
async function leerTodo<T>(token: string, ruta: string): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += PAGINA) {
    const pagina = (await pedir(token, `/rest/v1/${ruta}`, {
      "Range-Unit": "items",
      Range: `${desde}-${desde + PAGINA - 1}`,
    })) as T[];
    filas.push(...pagina);
    if (pagina.length < PAGINA) return filas;
  }
}

async function exigirAdminORecepcion(token: string) {
  const user = (await pedir(token, "/auth/v1/user")) as { id?: string };
  const perfiles = (await pedir(
    token,
    `/rest/v1/usuarios_sistema?id=eq.${user.id}&select=rol&limit=1`,
  )) as { rol: string }[];
  // Un doctor solo ve parte de las citas por RLS: el resultado sería engañoso.
  if (!perfiles[0] || !["admin", "recepcion"].includes(perfiles[0].rol)) {
    throw new Error("Solo administración y recepción pueden ver las alertas de abandono");
  }
}

export type AlertaChurnPanel = AlertaChurn & {
  nombre_completo: string;
  telefono: string | null;
  /** hay un contacto registrado después de su última asistencia */
  contactado: boolean;
};

export type RespuestaAlertas = {
  alertas: AlertaChurnPanel[];
  /** alertas ocultas porque el personal las retiró tras contactar al paciente */
  retiradas: number;
  diagnostico: Diagnostico;
  modelo: {
    fuente_datos: ModeloExportado["meta"]["fuente_datos"];
    entrenado_el: string;
    horizonte_dias: number;
  };
};

export const alertasChurn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ token: z.string().min(10), sedeId: z.string().uuid().optional() }).parse(input),
  )
  .handler(async ({ data }): Promise<RespuestaAlertas> => {
    await exigirAdminORecepcion(data.token);

    const [pacientes, citas, seguimiento] = await Promise.all([
      leerTodo<PacienteEntrada & { nombre_completo: string; telefono: string | null }>(
        data.token,
        "pacientes?select=id,nombre_completo,telefono,origen,municipio_zona,estado_journey&archivado=eq.false&order=id",
      ),
      leerTodo<CitaEntrada>(
        data.token,
        "citas_sesiones?select=paciente_id,sede_id,profesional_id,fecha_hora,estado,creado_el&order=id",
      ),
      leerTodo<SeguimientoEntrada>(
        data.token,
        "historial_seguimiento?select=paciente_id,fecha_contacto,canal&order=id",
      ),
    ]);

    const ahora = Date.now();
    const esRetiro = (s: SeguimientoEntrada) => s.canal === CANAL_RETIRO_ALERTA;
    const contacto = new Map(pacientes.map((p) => [p.id, p]));
    // El retiro no es un contacto real: no debe contar como atributo del modelo.
    const puntuadas = puntuarPacientes(
      MODELO,
      pacientes,
      citas,
      seguimiento.filter((s) => !esRetiro(s)),
      ahora,
    ).filter((a) => !data.sedeId || a.sede_id === data.sedeId);
    const { alertas: visibles, retiradas } = aplicarRetiros(
      puntuadas,
      citas,
      seguimiento,
      esRetiro,
      ahora,
    );
    const alertas = visibles.map((a) => ({
      ...a,
      nombre_completo: contacto.get(a.paciente_id)?.nombre_completo ?? "Paciente",
      telefono: contacto.get(a.paciente_id)?.telefono ?? null,
    }));

    return {
      alertas,
      retiradas,
      diagnostico: diagnosticar(MODELO, pacientes, citas, Date.now()),
      modelo: {
        fuente_datos: MODELO.meta.fuente_datos,
        entrenado_el: MODELO.meta.entrenado_el,
        horizonte_dias: MODELO.meta.horizonte_dias,
      },
    };
  });
