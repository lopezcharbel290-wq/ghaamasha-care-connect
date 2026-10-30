import type { Atributos, CitaEntrada, PacienteEntrada, SeguimientoEntrada } from "./types";

/**
 * Cálculo de atributos por paciente a una fecha de corte. Es el equivalente en
 * TypeScript de `construir_atributos` en ml/churn/churn_model.py: cualquier cambio
 * en uno debe hacerse en el otro y verificarse con ml/churn/verificar_paridad.mjs.
 */

const DIA = 86_400_000;
const MIN_SESIONES_ASISTIDAS = 1;

const ms = (iso: string) => Date.parse(iso);
const dias = (desde: number, hasta: number) => Math.floor((hasta - desde) / DIA);
const max = (xs: number[]) => xs.reduce((a, b) => (b > a ? b : a), -Infinity);
const min = (xs: number[]) => xs.reduce((a, b) => (b < a ? b : a), Infinity);

function agrupar<T extends { paciente_id: string }>(filas: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const f of filas) {
    const g = m.get(f.paciente_id);
    if (g) g.push(f);
    else m.set(f.paciente_id, [f]);
  }
  return m;
}

function moda(valores: string[]): string {
  const cuenta = new Map<string, number>();
  for (const v of valores) cuenta.set(v, (cuenta.get(v) ?? 0) + 1);
  const mayor = Math.max(...cuenta.values());
  return [...cuenta.entries()]
    .filter(([, n]) => n === mayor)
    .map(([v]) => v)
    .sort()[0]!;
}

export type FilaAtributos = { paciente_id: string; atributos: Atributos };

export function construirAtributos(
  pacientes: PacienteEntrada[],
  citas: CitaEntrada[],
  seguimiento: SeguimientoEntrada[],
  corte: number,
  ventanaActivoDias: number,
): FilaAtributos[] {
  const infoPaciente = new Map(pacientes.map((p) => [p.id, p]));
  const seg = agrupar(
    seguimiento
      .filter((s) => ms(s.fecha_contacto) < corte)
      .map((s) => ({ paciente_id: s.paciente_id, t: ms(s.fecha_contacto) })),
  );
  const visibles = citas
    .filter((c) => ms(c.creado_el) < corte) // lo que existía en el sistema en T
    .map((c) => ({ ...c, t: ms(c.fecha_hora) }));

  const salida: FilaAtributos[] = [];
  for (const [id, cs] of agrupar(visibles)) {
    const pasadas = cs.filter((c) => c.t < corte);
    const futuras = cs.filter((c) => c.t >= corte && c.estado !== "cancelada");
    const asist = pasadas.filter((c) => c.estado === "asistio");
    if (asist.length < MIN_SESIONES_ASISTIDAS) continue;

    const tAsist = asist.map((c) => c.t).sort((a, b) => a - b);
    const diasUltima = dias(max(tAsist), corte);
    if (diasUltima > ventanaActivoDias) continue;

    const paciente = infoPaciente.get(id);
    if (!paciente || paciente.estado_journey === "alta") continue;

    const noAsistio = pasadas.filter((c) => c.estado === "no_asistio");
    const cuenta = (xs: { t: number }[], iniDias: number, finDias: number) =>
      xs.filter((c) => c.t >= corte - iniDias * DIA && c.t < corte - finDias * DIA).length;

    const nAsist = asist.length;
    const intervalos = tAsist.slice(1).map((t, i) => dias(tAsist[i]!, t));
    const intervalo = intervalos.length
      ? intervalos.reduce((a, b) => a + b, 0) / intervalos.length
      : null;
    const a30 = cuenta(asist, 30, 0);
    const profesionales = new Set(
      asist.map((c) => c.profesional_id).filter((p): p is string => p != null),
    );
    const contactos = seg.get(id) ?? [];
    const proxima = futuras.length ? min(futuras.map((c) => c.t)) : null;

    salida.push({
      paciente_id: id,
      atributos: {
        n_asistidas: nAsist,
        n_no_asistio: noAsistio.length,
        n_canceladas: pasadas.filter((c) => c.estado === "cancelada").length,
        tasa_inasistencia: noAsistio.length / (noAsistio.length + nAsist),
        dias_desde_ultima_asistencia: diasUltima,
        dias_desde_primera_cita: dias(min(pasadas.map((c) => c.t)), corte),
        intervalo_medio_dias: intervalo,
        ratio_brecha_vs_intervalo: intervalo === null ? null : diasUltima / Math.max(intervalo, 1),
        asistidas_30d: a30,
        asistidas_60d: cuenta(asist, 60, 0),
        inasistencias_30d: cuenta(noAsistio, 30, 0),
        tendencia_frecuencia: a30 - cuenta(asist, 60, 30),
        tiene_cita_futura: proxima === null ? 0 : 1,
        dias_hasta_proxima_cita: proxima === null ? null : dias(corte, proxima),
        n_profesionales: profesionales.size,
        n_contactos: contactos.length,
        dias_desde_ultimo_contacto: contactos.length
          ? dias(max(contactos.map((s) => s.t)), corte)
          : null,
        origen: paciente.origen,
        municipio_zona: paciente.municipio_zona,
        sede_principal: moda(asist.map((c) => c.sede_id)),
        estado_journey: paciente.estado_journey,
      },
    });
  }
  return salida;
}
