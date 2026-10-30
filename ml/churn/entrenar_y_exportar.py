"""Entrena el modelo y lo exporta al CRM.

Con datos sintéticos (solo para probar el pipeline):
    python entrenar_y_exportar.py --fuente sintetico

Con datos reales: exporta desde Supabase (Table Editor -> Export CSV) las tablas
pacientes, citas_sesiones e historial_seguimiento a una carpeta y ejecuta:
    python entrenar_y_exportar.py --fuente csv --carpeta ruta/a/los/csv

Escribe:
    ../../src/lib/churn/modelo-churn.json   (lo que carga el CRM)
    paridad.json                            (para verificar el puerto TypeScript)
"""

import argparse
import json
from pathlib import Path

import pandas as pd

from churn_model import (
    HORIZONTE_DIAS, construir_atributos, construir_dataset, entrenar, exportar_modelo, fixture_paridad,
)

RAIZ = Path(__file__).resolve().parents[2]
SALIDA_MODELO = RAIZ / "src" / "lib" / "churn" / "modelo-churn.json"
SALIDA_PARIDAD = Path(__file__).resolve().parent / "paridad.json"
SALIDA_ATRIBUTOS = Path(__file__).resolve().parent / "paridad_atributos.json"


def cargar_csv(carpeta: Path):
    pacientes, citas, seg = (
        pd.read_csv(carpeta / f"{n}.csv") for n in ("pacientes", "citas_sesiones", "historial_seguimiento")
    )
    for df, cols in ((citas, ["fecha_hora", "creado_el"]), (seg, ["fecha_contacto"])):
        for c in cols:  # el modelo trabaja con horas locales sin zona horaria
            df[c] = pd.to_datetime(df[c], utc=True).dt.tz_convert("America/Mexico_City").dt.tz_localize(None)
    return pacientes, citas, seg


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--fuente", choices=["sintetico", "csv"], default="sintetico")
    ap.add_argument("--carpeta", type=Path)
    args = ap.parse_args()

    if args.fuente == "csv":
        pacientes, citas, seg = cargar_csv(args.carpeta)
    else:
        from datos_sinteticos import generar_datos
        pacientes, citas, seg = generar_datos()

    ds = construir_dataset(pacientes, citas, seg)
    print(f"Dataset: {len(ds)} filas, {ds['paciente_id'].nunique()} pacientes, churn={ds['churn'].mean():.1%} (horizonte {HORIZONTE_DIAS} d)")
    modelo, metricas = entrenar(ds)
    print(json.dumps(metricas, indent=2))

    SALIDA_MODELO.parent.mkdir(parents=True, exist_ok=True)
    SALIDA_MODELO.write_text(json.dumps(exportar_modelo(modelo, metricas, args.fuente)), encoding="utf-8")
    SALIDA_PARIDAD.write_text(json.dumps(fixture_paridad(modelo, ds)), encoding="utf-8")
    print(f"Modelo -> {SALIDA_MODELO}\nParidad -> {SALIDA_PARIDAD}")

    if args.fuente == "sintetico":  # con datos reales no se escriben pacientes en el repo
        corte = pd.Timestamp("2026-07-15")
        muestra = pd.Series(pacientes["id"]).sample(500, random_state=1)
        iso = lambda s: s.dt.strftime("%Y-%m-%dT%H:%M:%SZ")  # noqa: E731
        c = citas[citas["paciente_id"].isin(muestra)].assign(fecha_hora=lambda d: iso(d["fecha_hora"]), creado_el=lambda d: iso(d["creado_el"]))
        s = seg[seg["paciente_id"].isin(muestra)].assign(fecha_contacto=lambda d: iso(d["fecha_contacto"]))
        esperado = construir_atributos(pacientes, citas, seg, corte)
        esperado = esperado[esperado["paciente_id"].isin(muestra)].drop(columns=["corte"])
        SALIDA_ATRIBUTOS.write_text(json.dumps({
            "corte": corte.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "pacientes": pacientes[pacientes["id"].isin(muestra)][["id", "origen", "municipio_zona", "estado_journey"]].to_dict("records"),
            "citas": c[["paciente_id", "sede_id", "profesional_id", "fecha_hora", "estado", "creado_el"]].to_dict("records"),
            "seguimiento": s[["paciente_id", "fecha_contacto"]].to_dict("records"),
            "esperado": json.loads(esperado.to_json(orient="records")),
        }), encoding="utf-8")
        print(f"Atributos -> {SALIDA_ATRIBUTOS}")
