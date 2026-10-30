// Comprueba que el puerto TypeScript da lo mismo que Python.
//   node ml/churn/verificar_paridad.mjs   (Node >= 22.18, ejecuta .ts directamente)
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const aqui = dirname(fileURLToPath(import.meta.url));
const lib = join(aqui, "..", "..", "src", "lib", "churn");
const leer = (ruta) => JSON.parse(readFileSync(ruta, "utf8"));

const { probabilidades, contribuciones } = await import(pathToFileURL(join(lib, "modelo.ts")).href);
const { construirAtributos } = await import(pathToFileURL(join(lib, "features.ts")).href);

const modelo = leer(join(lib, "modelo-churn.json"));
const paridad = leer(join(aqui, "paridad.json"));
let fallos = 0;
const cerca = (a, b, tol) => Math.abs(a - b) <= tol;

// 1. Modelo: probabilidades y SHAP por fila
let maxP = 0, maxShap = 0;
for (const fila of paridad.filas) {
  const r = probabilidades(modelo, fila.entrada);
  maxP = Math.max(maxP, Math.abs(r.p - fila.p), Math.abs(r.pLr - fila.p_lr), Math.abs(r.pXgb - fila.p_xgb));
  const phi = contribuciones(modelo, fila.entrada);
  fila.contribuciones.forEach((v, i) => (maxShap = Math.max(maxShap, Math.abs(v - phi[i]))));
}
console.log(`Modelo (${paridad.filas.length} filas): máx |Δp| = ${maxP.toExponential(2)}, máx |ΔSHAP| = ${maxShap.toExponential(2)}`);
if (maxP > 1e-5 || maxShap > 1e-3) { console.error("FALLA: modelo/SHAP difieren de Python"); fallos++; }

// 2. Atributos: tablas crudas -> atributos
try {
  const a = leer(join(aqui, "paridad_atributos.json"));
  const obtenido = construirAtributos(a.pacientes, a.citas, a.seguimiento, Date.parse(a.corte), modelo.meta.ventana_activo_dias);
  const porId = new Map(obtenido.map((f) => [f.paciente_id, f.atributos]));
  let malos = 0;
  for (const esp of a.esperado) {
    const got = porId.get(esp.paciente_id);
    if (!got) { console.error("Falta paciente", esp.paciente_id); malos++; continue; }
    for (const k of [...modelo.numericas, ...Object.keys(modelo.categoricas)]) {
      const e = esp[k] ?? null, g = got[k] ?? null;
      const ok = typeof e === "number" && typeof g === "number" ? cerca(e, g, 1e-9) : e === g;
      if (!ok) { console.error(`Difiere ${esp.paciente_id}.${k}: python=${e} ts=${g}`); malos++; }
    }
  }
  if (obtenido.length !== a.esperado.length) { console.error(`Pacientes: python=${a.esperado.length} ts=${obtenido.length}`); malos++; }
  console.log(`Atributos (${a.esperado.length} pacientes): ${malos === 0 ? "idénticos" : malos + " diferencias"}`);
  if (malos) fallos++;
} catch (e) {
  if (e.code !== "ENOENT") throw e;
  console.log("Atributos: sin fixture (solo se genera con --fuente sintetico)");
}

process.exit(fallos ? 1 : 0);
