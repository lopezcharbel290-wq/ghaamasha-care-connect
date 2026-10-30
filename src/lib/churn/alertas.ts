import { construirAtributos } from "./features";
import { nivelRiesgo, probabilidades, razones } from "./modelo";
import type {
  AlertaChurn,
  CitaEntrada,
  ModeloExportado,
  PacienteEntrada,
  SeguimientoEntrada,
} from "./types";

const ESTADOS_PUNTUABLES = ["en_tratamiento", "en_riesgo"];

export type Diagnostico = {
  pacientes: number;
  citas: number;
  citasPorEstado: Record<string, number>;
  conAsistencia: number;
  activos: number;
  activosPorJourney: Record<string, number>;
  puntuables: number;
};

/** Cuántos pacientes sobreviven a cada filtro del modelo: explica por qué no hay alertas. */
export function diagnosticar(
  modelo: ModeloExportado,
  pacientes: PacienteEntrada[],
  citas: CitaEntrada[],
  hoy: number,
): Diagnostico {
  const ultima = new Map<string, number>();
  const citasPorEstado: Record<string, number> = {};
  for (const c of citas) {
    citasPorEstado[c.estado] = (citasPorEstado[c.estado] ?? 0) + 1;
    const t = Date.parse(c.fecha_hora);
    if (c.estado === "asistio" && t < hoy)
      ultima.set(c.paciente_id, Math.max(ultima.get(c.paciente_id) ?? 0, t));
  }
  const limite = hoy - modelo.meta.ventana_activo_dias * 86_400_000;
  const activosPorJourney: Record<string, number> = {};
  for (const p of pacientes) {
    if ((ultima.get(p.id) ?? 0) < limite) continue;
    const j = p.estado_journey ?? "sin_estado";
    activosPorJourney[j] = (activosPorJourney[j] ?? 0) + 1;
  }
  return {
    pacientes: pacientes.length,
    citas: citas.length,
    citasPorEstado,
    conAsistencia: ultima.size,
    activos: Object.values(activosPorJourney).reduce((a, b) => a + b, 0),
    activosPorJourney,
    puntuables: ESTADOS_PUNTUABLES.reduce((n, e) => n + (activosPorJourney[e] ?? 0), 0),
  };
}

/** Puntúa a los pacientes activos en tratamiento y los ordena de mayor a menor riesgo. */
export function puntuarPacientes(
  modelo: ModeloExportado,
  pacientes: PacienteEntrada[],
  citas: CitaEntrada[],
  seguimiento: SeguimientoEntrada[],
  hoy: number,
): AlertaChurn[] {
  return construirAtributos(pacientes, citas, seguimiento, hoy, modelo.meta.ventana_activo_dias)
    .filter((f) => ESTADOS_PUNTUABLES.includes(String(f.atributos["estado_journey"])))
    .map(({ paciente_id, atributos: a }) => {
      const { p } = probabilidades(modelo, a);
      return {
        paciente_id,
        sede_id: (a["sede_principal"] as string | null) ?? null,
        probabilidad: p,
        nivel: nivelRiesgo(modelo, p),
        razones: razones(modelo, a),
        dias_desde_ultima_asistencia: a["dias_desde_ultima_asistencia"] as number,
        tiene_cita_futura: a["tiene_cita_futura"] === 1,
        tasa_inasistencia: a["tasa_inasistencia"] as number,
      };
    })
    .sort((x, y) => y.probabilidad - x.probabilidad);
}
