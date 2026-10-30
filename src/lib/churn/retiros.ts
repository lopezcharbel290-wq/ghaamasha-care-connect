import type { AlertaChurn, CitaEntrada, SeguimientoEntrada } from "./types";

/**
 * Marca qué alertas ya tienen contacto y oculta las retiradas por el personal.
 * Un contacto o retiro solo cuenta si ocurrió DESPUÉS de la última asistencia del
 * paciente: si vuelve a asistir y luego se aleja otra vez, la alerta reaparece.
 */
export function aplicarRetiros<A extends AlertaChurn>(
  alertas: A[],
  citas: CitaEntrada[],
  seguimiento: SeguimientoEntrada[],
  esRetiro: (s: SeguimientoEntrada) => boolean,
  ahora: number,
): { alertas: (A & { contactado: boolean })[]; retiradas: number } {
  const ultimo = (filas: { id: string; fecha: string }[]) => {
    const m = new Map<string, number>();
    for (const { id, fecha } of filas) m.set(id, Math.max(m.get(id) ?? 0, Date.parse(fecha)));
    return m;
  };
  const ultimaAsistencia = ultimo(
    citas
      .filter((c) => c.estado === "asistio" && Date.parse(c.fecha_hora) < ahora)
      .map((c) => ({ id: c.paciente_id, fecha: c.fecha_hora })),
  );
  const aFilas = (s: SeguimientoEntrada[]) =>
    s.map((x) => ({ id: x.paciente_id, fecha: x.fecha_contacto }));
  const ultimoContacto = ultimo(aFilas(seguimiento.filter((s) => !esRetiro(s))));
  const ultimoRetiro = ultimo(aFilas(seguimiento.filter(esRetiro)));

  const despuesDeAsistir = (m: Map<string, number>, id: string) =>
    (m.get(id) ?? 0) > (ultimaAsistencia.get(id) ?? 0);

  const visibles = alertas
    .filter((a) => !despuesDeAsistir(ultimoRetiro, a.paciente_id))
    .map((a) => ({ ...a, contactado: despuesDeAsistir(ultimoContacto, a.paciente_id) }));
  return { alertas: visibles, retiradas: alertas.length - visibles.length };
}
