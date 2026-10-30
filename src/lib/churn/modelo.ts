import type { Atributos, ModeloExportado, NivelRiesgo, Razon } from "./types";

/**
 * Inferencia del modelo de churn en TypeScript puro (sin Python en producción).
 * Reproduce churn_model.py: regresión logística + XGBoost + ensamble, y las
 * contribuciones TreeSHAP exactas de XGBoost para explicar cada alerta.
 */

const sigmoide = (z: number) => 1 / (1 + Math.exp(-z));

function numero(f: Atributos, k: string): number {
  const v = f[k];
  return typeof v === "number" && Number.isFinite(v) ? v : NaN;
}

function onehot(m: ModeloExportado, f: Atributos): number[] {
  const out: number[] = [];
  for (const [col, cats] of Object.entries(m.categoricas)) {
    const v = f[col] == null ? "desconocido" : String(f[col]);
    for (const cat of cats) out.push(v === cat ? 1 : 0);
  }
  return out;
}

/** Numéricas crudas (NaN = faltante, XGBoost lo maneja) + one-hot. */
export function vectorXgb(m: ModeloExportado, f: Atributos): number[] {
  return [...m.numericas.map((k) => numero(f, k)), ...onehot(m, f)];
}

/** Numéricas imputadas con la mediana y estandarizadas + one-hot. */
export function vectorLr(m: ModeloExportado, f: Atributos): number[] {
  const { medianas, medias, desvios } = m.logistico;
  const num = m.numericas.map((k) => {
    const v = numero(f, k);
    return ((Number.isNaN(v) ? medianas[k]! : v) - medias[k]!) / desvios[k]!;
  });
  return [...num, ...onehot(m, f)];
}

function siguiente(t: ModeloExportado["xgboost"]["arboles"][number], i: number, x: number[]) {
  const v = x[t.feat[i]!]!;
  if (Number.isNaN(v)) return t.faltante_izq[i] ? t.izq[i]! : t.der[i]!;
  // XGBoost compara en float32; el JSON imprime el umbral con precisión corta
  return Math.fround(v) < Math.fround(t.umbral[i]!) ? t.izq[i]! : t.der[i]!;
}

function margenXgb(m: ModeloExportado, x: number[]): number {
  const b = m.xgboost.base_score;
  let margen = Math.log(b / (1 - b));
  for (const t of m.xgboost.arboles) {
    let i = 0;
    while (t.izq[i] !== -1) i = siguiente(t, i, x);
    margen += t.valor[i]!;
  }
  return margen;
}

export function probabilidades(m: ModeloExportado, f: Atributos) {
  const xl = vectorLr(m, f);
  let z = m.logistico.intercepto;
  for (let i = 0; i < xl.length; i++) z += m.logistico.coeficientes[i]! * xl[i]!;
  const pLr = sigmoide(z);
  const pXgb = sigmoide(margenXgb(m, vectorXgb(m, f)));
  const p = m.ensamble.peso_xgb * pXgb + (1 - m.ensamble.peso_xgb) * pLr;
  return { p, pLr, pXgb };
}

export function nivelRiesgo(m: ModeloExportado, p: number): NivelRiesgo {
  if (p > m.ensamble.umbral_alto) return "alto";
  if (p > m.ensamble.umbral_medio) return "medio";
  return "bajo";
}

/* ------------------------------- TreeSHAP -------------------------------- */

type Elemento = { f: number; z: number; o: number; w: number };

function extender(path: Elemento[], d: number, z: number, o: number, f: number) {
  path[d] = { f, z, o, w: d === 0 ? 1 : 0 };
  for (let i = d - 1; i >= 0; i--) {
    path[i + 1]!.w += (o * path[i]!.w * (i + 1)) / (d + 1);
    path[i]!.w = (z * path[i]!.w * (d - i)) / (d + 1);
  }
}

function desenrollar(path: Elemento[], d: number, idx: number) {
  const { o, z } = path[idx]!;
  let siguienteO = path[d]!.w;
  for (let i = d - 1; i >= 0; i--) {
    if (o !== 0) {
      const tmp = path[i]!.w;
      path[i]!.w = (siguienteO * (d + 1)) / ((i + 1) * o);
      siguienteO = tmp - (path[i]!.w * z * (d - i)) / (d + 1);
    } else {
      path[i]!.w = (path[i]!.w * (d + 1)) / (z * (d - i));
    }
  }
  for (let i = idx; i < d; i++) {
    path[i]!.f = path[i + 1]!.f;
    path[i]!.z = path[i + 1]!.z;
    path[i]!.o = path[i + 1]!.o;
  }
}

function sumaDesenrollada(path: Elemento[], d: number, idx: number): number {
  const { o, z } = path[idx]!;
  let siguienteO = path[d]!.w;
  let total = 0;
  for (let i = d - 1; i >= 0; i--) {
    if (o !== 0) {
      const tmp = (siguienteO * (d + 1)) / ((i + 1) * o);
      total += tmp;
      siguienteO = path[i]!.w - (tmp * z * (d - i)) / (d + 1);
    } else {
      total += path[i]!.w / z / ((d - i) / (d + 1));
    }
  }
  return total;
}

function recorrer(
  t: ModeloExportado["xgboost"]["arboles"][number],
  x: number[],
  phi: number[],
  nodo: number,
  d: number,
  padre: Elemento[],
  pz: number,
  po: number,
  pf: number,
) {
  const path = padre.slice(0, d).map((e) => ({ ...e }));
  extender(path, d, pz, po, pf);

  if (t.izq[nodo] === -1) {
    for (let i = 1; i <= d; i++) {
      const w = sumaDesenrollada(path, d, i);
      const el = path[i]!;
      phi[el.f] = phi[el.f]! + w * (el.o - el.z) * t.valor[nodo]!;
    }
    return;
  }

  const caliente = siguiente(t, nodo, x);
  const frio = caliente === t.izq[nodo] ? t.der[nodo]! : t.izq[nodo]!;
  const feat = t.feat[nodo]!;
  const zCal = t.cover[caliente]! / t.cover[nodo]!;
  const zFrio = t.cover[frio]! / t.cover[nodo]!;
  let zEntrante = 1;
  let oEntrante = 1;
  let dd = d;
  let k = 0;
  for (; k <= dd; k++) if (path[k]!.f === feat) break;
  if (k <= dd) {
    zEntrante = path[k]!.z;
    oEntrante = path[k]!.o;
    desenrollar(path, dd, k);
    dd -= 1;
  }
  recorrer(t, x, phi, caliente, dd + 1, path, zCal * zEntrante, oEntrante, feat);
  recorrer(t, x, phi, frio, dd + 1, path, zFrio * zEntrante, 0, feat);
}

/** Contribución de cada columna al logit de XGBoost (+ sesgo en la última posición). */
export function contribuciones(m: ModeloExportado, f: Atributos): number[] {
  const x = vectorXgb(m, f);
  const phi = new Array<number>(x.length + 1).fill(0);
  const b = m.xgboost.base_score;
  phi[x.length] = Math.log(b / (1 - b));
  for (const t of m.xgboost.arboles) {
    phi[x.length] = phi[x.length]! + t.valor[0]!;
    recorrer(t, x, phi, 0, 0, [], 1, 1, -1);
  }
  return phi;
}

/* ------------------------------- Explicación ------------------------------ */

const redondear = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

const ETIQUETAS: Record<string, (v: number) => string> = {
  n_asistidas: (v) => `Solo ${redondear(v)} sesiones asistidas`,
  n_no_asistio: (v) => `${redondear(v)} inasistencias acumuladas`,
  n_canceladas: (v) => `${redondear(v)} citas canceladas`,
  tasa_inasistencia: (v) => `Falta al ${Math.round(v * 100)}% de sus citas`,
  dias_desde_ultima_asistencia: (v) => `${redondear(v)} días sin asistir`,
  dias_desde_primera_cita: (v) => `${redondear(v)} días desde su primera cita`,
  intervalo_medio_dias: (v) => `Suele venir cada ${redondear(v)} días`,
  ratio_brecha_vs_intervalo: (v) => `Lleva ${v.toFixed(1)}× su intervalo habitual sin venir`,
  asistidas_30d: (v) => `${redondear(v)} sesiones en los últimos 30 días`,
  asistidas_60d: (v) => `${redondear(v)} sesiones en los últimos 60 días`,
  inasistencias_30d: (v) => `${redondear(v)} inasistencias en los últimos 30 días`,
  tendencia_frecuencia: (v) =>
    `Su frecuencia de asistencia ${v < 0 ? "bajó" : "cambió"} (${v > 0 ? "+" : ""}${redondear(v)} sesiones vs. mes previo)`,
  tiene_cita_futura: (v) => (v ? "Tiene cita agendada" : "No tiene próxima cita agendada"),
  dias_hasta_proxima_cita: (v) => `Su próxima cita es en ${redondear(v)} días`,
  n_profesionales: (v) => `Ha visto a ${redondear(v)} terapeutas distintos`,
  n_contactos: (v) => `${redondear(v)} contactos de seguimiento`,
  dias_desde_ultimo_contacto: (v) => `${redondear(v)} días desde el último contacto`,
};

function describir(m: ModeloExportado, columna: string, valor: number): string {
  if (columna.includes("=")) {
    const [campo, cat] = columna.split("=") as [string, string];
    return `${campo.replace(/_/g, " ")}: ${cat}`;
  }
  if (Number.isNaN(valor)) {
    return columna === "dias_hasta_proxima_cita"
      ? "No tiene próxima cita agendada"
      : `${columna.replace(/_/g, " ")}: sin dato`;
  }
  return (ETIQUETAS[columna] ?? ((v) => `${columna}=${redondear(v)}`))(valor);
}

/** Los `top` factores que más empujan el riesgo hacia arriba. */
export function razones(m: ModeloExportado, f: Atributos, top = 3): Razon[] {
  const phi = contribuciones(m, f);
  const x = vectorXgb(m, f);
  return m.columnas
    .map((columna, i) => ({ columna, impacto: phi[i]!, valor: x[i]! }))
    .filter(
      (r) =>
        r.impacto > 0 &&
        !r.columna.startsWith("sede_principal=") &&
        // un dato faltante solo es explicable para la próxima cita ("no tiene")
        (!Number.isNaN(r.valor) || r.columna === "dias_hasta_proxima_cita"),
    )
    .sort((a, b) => b.impacto - a.impacto)
    .map((r) => ({
      columna: r.columna,
      texto: describir(m, r.columna, r.valor),
      impacto: r.impacto,
    }))
    .filter((r, i, todas) => todas.findIndex((o) => o.texto === r.texto) === i)
    .slice(0, top);
}
